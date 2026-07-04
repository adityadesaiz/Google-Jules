import logging
import json
from typing import Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr, Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    GEMINI_API_KEY: SecretStr
    ANTHROPIC_API_KEY: SecretStr

    # Strictly unassigned plain strings without hardcoded defaults
    GEMINI_MODEL_ID: str
    ANTHROPIC_MODEL_ID: str

    # Required: Will fail startup validation if missing
    MASTER_PROFILE_SHA256: str = Field(..., description="SHA-256 hash of the master profile for tamper protection")

    DB_PATH: str = "app_funnel.db"
    DAILY_BUDGET_CAP_USD: float = 10.00
    USER_DATA_DIR: str

settings = Settings()

# --- Contextual Structured Logging Factory ---
def get_structured_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        handler = logging.StreamHandler()
        logger.addHandler(handler)
    return logger

def log_event(logger: logging.Logger, level: int, msg: str, job_hash: str, phase: str, status: str, **kwargs: Any) -> None:
    """Forces the inclusion of job_hash, phase, and status on every log line."""
    log_entry = {
        "job_hash": job_hash,
        "phase": phase,
        "status": status,
        "message": msg,
        **kwargs
    }
    logger.log(level, json.dumps(log_entry))
