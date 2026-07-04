import hashlib
import logging
import json
from typing import List, Tuple
from pydantic import BaseModel, Field
import litellm
from tenacity import retry, wait_exponential, stop_after_attempt

from .config import settings, get_structured_logger, log_event

logger = get_structured_logger(__name__)

class GeminiExtraction(BaseModel):
    required_years_experience: int = Field(description="Years of experience required")
    remote_eligible: bool = Field(description="Is the job remote?")
    mandatory_certifications: List[str] = Field(description="List of mandatory certifications")
    security_clearance_required: bool = Field(description="Is a security clearance required?")

class ImmutableProfile:
    def __init__(self, profile_path: str = "master_profile.md"):
        self.profile_path = profile_path
        self.content = ""

    def load_and_verify(self) -> None:
        """Call this in FastAPI Lifespan block"""
        with open(self.profile_path, "r", encoding="utf-8") as f:
            self.content = f.read()

        current_hash = hashlib.sha256(self.content.encode("utf-8")).hexdigest()
        if current_hash != settings.MASTER_PROFILE_SHA256:
            raise RuntimeError(f"CRITICAL: Profile tamper detected! Expected {settings.MASTER_PROFILE_SHA256}, got {current_hash}")

profile_service = ImmutableProfile()

class AgentService:
    def __init__(self):
        self.total_cost = 0.0

    def _track_cost(self, cost: float, job_hash: str) -> None:
        if cost is None:
            return
        self.total_cost += cost
        if self.total_cost > settings.DAILY_BUDGET_CAP_USD:
            log_event(logger, logging.CRITICAL, "Budget cap breached!", job_hash, "cost_monitor", "blocked_manual_required")
            raise Exception("Daily budget cap exceeded")

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
    async def extract_and_route(self, job_hash: str, raw_jd_text: str) -> str:
        try:
            response = await litellm.acompletion(
                model=settings.GEMINI_MODEL_ID,
                api_key=settings.GEMINI_API_KEY.get_secret_value(),
                messages=[{"role": "user", "content": f"Extract the following info as JSON: {raw_jd_text}"}],
                response_format={"type": "json_object"}
            )
            cost = litellm.completion_cost(completion_response=response)
            self._track_cost(cost, job_hash)

            # Deterministic Python mapping evaluation
            data = GeminiExtraction.model_validate_json(response.choices[0].message.content)
            score = 100

            # Rule 1: Deduct points if years of experience > 10
            if data.required_years_experience > 10:
                score -= 30

            # Rule 2: Deduct points if not remote eligible
            if not data.remote_eligible:
                score -= 15

            # Rule 3: Deduct points based on the number of mandatory certifications
            score -= len(data.mandatory_certifications) * 5

            # Rule 4: Deduct points if security clearance is required
            if data.security_clearance_required:
                score -= 40

            status = "qualified" if score >= 75 else "manual_review" if score >= 60 else "disqualified"

            log_event(logger, logging.INFO, f"Scored {score}", job_hash, "router", status)
            return status
        except Exception as e:
            log_event(logger, logging.ERROR, f"Extraction failed: {str(e)}", job_hash, "router", "automation_failed")
            raise

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
    async def tailor_and_verify(self, job_hash: str, raw_jd_text: str) -> Tuple[str, List[str]]:
        try:
            response = await litellm.acompletion(
                model=settings.ANTHROPIC_MODEL_ID,
                api_key=settings.ANTHROPIC_API_KEY.get_secret_value(),
                messages=[
                    {"role": "system", "content": "You are a resume writer. Output ONLY a JSON list of bullet points for the resume based on the provided profile and job description."}
                ],
            )
            cost = litellm.completion_cost(completion_response=response)
            self._track_cost(cost, job_hash)

            claims: List[str] = json.loads(response.choices[0].message.content)

            # Substring Containment Verifier
            valid_claims = []
            dropped_claims_count = 0
            for claim in claims:
                # Word-for-word native Python substring assertion
                if claim.strip() in profile_service.content:
                    valid_claims.append(claim)
                else:
                    dropped_claims_count += 1

            if claims and (dropped_claims_count / len(claims)) > 0.5:
                log_event(logger, logging.WARNING, f"Fabrication detected. Dropped claims count: {dropped_claims_count} (>50%)", job_hash, "tailor", "manual_review")
                return "manual_review", valid_claims

            log_event(logger, logging.INFO, "Tailoring successful", job_hash, "tailor", "staged")
            return "staged", valid_claims
        except Exception as e:
            log_event(logger, logging.ERROR, f"Tailor failed: {str(e)}", job_hash, "tailor", "automation_failed")
            raise
