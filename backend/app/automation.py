import asyncio
import json
import os
import random
import logging
from typing import Dict, Any, List
from playwright.async_api import async_playwright
from tenacity import retry, wait_exponential, stop_after_attempt

from .config import settings, get_structured_logger, log_event

logger = get_structured_logger(__name__)

# Global registry for HITL events (Sync Gate)
hitl_registry: Dict[str, asyncio.Event] = {}

class AutomationService:
    def __init__(self, concurrency_limit: int = 2):
        self.semaphore = asyncio.Semaphore(concurrency_limit)

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
    async def process_job_application(self, job_hash: str, url: str, field_map: dict) -> str:
        async with self.semaphore:
            try:
                log_event(logger, logging.INFO, "Starting browser automation", job_hash, "browser", "started")
                async with async_playwright() as p:
                    # Persistent Session Strategy
                    browser = await p.chromium.launch_persistent_context(
                        user_data_dir=settings.USER_DATA_DIR,
                        headless=False
                    )
                    page = await browser.new_page()
                    await page.goto(url)
                    await asyncio.sleep(random.uniform(1.0, 3.0))

                    # 403 / Captcha / OTP evaluation
                    # Check for typical trust block signatures
                    blocks = await asyncio.gather(
                        page.locator("text=CAPTCHA").count(),
                        page.locator("text=Verify it's you").count()
                    )

                    if any(b > 0 for b in blocks):
                        log_event(logger, logging.WARNING, "Trust/Captcha block detected", job_hash, "browser", "blocked_manual_required")
                        os.makedirs(f"./audit_logs/{job_hash}", exist_ok=True)
                        await page.screenshot(path=f"./audit_logs/{job_hash}/blocked.png")
                        return "blocked_manual_required"

                    # Local Payload Serialization
                    # Ensured to happen immediately before await event.wait()
                    os.makedirs(f"./audit_logs/{job_hash}", exist_ok=True)
                    with open(f"./audit_logs/{job_hash}/field_map.json", "w") as f:
                        json.dump(field_map, f)
                    await page.screenshot(path=f"./audit_logs/{job_hash}/audit.png")

                    # Crash-Recoverable Synchronization Gate
                    log_event(logger, logging.INFO, "Awaiting Human-in-the-Loop release", job_hash, "browser", "awaiting_hitl")

                    event = asyncio.Event()
                    hitl_registry[job_hash] = event

                    # Suspend execution while retaining interactive host monitor access
                    await event.wait()

                    # Finalization Execution
                    await page.click("button[type='submit']")
                    await asyncio.sleep(random.uniform(2.0, 3.5))
                    await page.screenshot(path=f"./audit_logs/{job_hash}/finalized.png")

                    log_event(logger, logging.INFO, "Submission verified", job_hash, "browser", "submitted")
                    await browser.close()
                    return "submitted"
            except Exception as e:
                log_event(logger, logging.ERROR, f"Automation crash: {str(e)}", job_hash, "browser", "automation_failed")
                raise

    async def release_hitl_gate(self, job_hash: str) -> bool:
        """Called by FastAPI via frontend trigger to unblock the worker thread."""
        if job_hash in hitl_registry:
            hitl_registry[job_hash].set()
            del hitl_registry[job_hash]
            return True
        return False

    async def recover_pending_hitl_jobs(self, pending_jobs: List[Dict[str, Any]]) -> None:
        """Call in FastAPI lifespan context to scan and re-stage jobs left hanging after a backend crash."""
        for job in pending_jobs:
            job_hash = job.get('job_hash')
            if job_hash:
                log_event(logger, logging.INFO, "Recovered awaiting_hitl job from DB at boot", job_hash, "recovery", "awaiting_hitl")
                # Register event to allow UI to trigger it
                if job_hash not in hitl_registry:
                    hitl_registry[job_hash] = asyncio.Event()
