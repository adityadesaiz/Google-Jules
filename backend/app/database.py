import aiosqlite
import hashlib
import re
import logging
from datetime import datetime, timezone
from typing import Optional, List
from tenacity import retry, wait_exponential, stop_after_attempt

from .config import settings, get_structured_logger, log_event

logger = get_structured_logger(__name__)

def generate_robust_job_hash(company: str, title: str, raw_jd_text: str) -> str:
    """Fuzzy deduplication helper to generate SHA-256 hash."""
    norm_comp = re.sub(r'[^a-z0-9]', '', company.lower())
    norm_title = re.sub(r'[^a-z0-9]', '', title.lower())
    norm_jd = re.sub(r'[^a-z0-9]', '', raw_jd_text.lower())[:500]

    payload = f"{norm_comp}{norm_title}{norm_jd}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def jaccard_similarity(text1: str, text2: str) -> float:
    """Calculates Jaccard similarity between two text strings based on token sets."""
    set1 = set(re.sub(r'[^a-z0-9\s]', '', text1.lower()).split())
    set2 = set(re.sub(r'[^a-z0-9\s]', '', text2.lower()).split())
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    if not union:
        return 0.0
    return len(intersection) / len(union)

class DatabaseService:
    def __init__(self, db_path: str = settings.DB_PATH):
        self.db_path = db_path

    async def init_db(self) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("PRAGMA journal_mode=WAL;")
            await db.execute("""
                CREATE TABLE IF NOT EXISTS jobs_discovered (
                    job_hash TEXT PRIMARY KEY,
                    company TEXT,
                    title TEXT,
                    url TEXT,
                    compatibility_score REAL,
                    disqualified_reasons TEXT,
                    processing_status TEXT,
                    rubric_version TEXT,
                    manual_override BOOLEAN,
                    raw_jd_text TEXT NOT NULL,
                    discovered_at TEXT,
                    updated_at TEXT
                )
            """)
            await db.execute("CREATE INDEX IF NOT EXISTS idx_processing_status ON jobs_discovered(processing_status);")
            await db.commit()

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(5))
    async def insert_job(self, job_hash: str, company: str, title: str, url: str, raw_jd_text: str, rubric_version: str) -> None:
        try:
            now = datetime.now(timezone.utc).isoformat()
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("PRAGMA journal_mode=WAL;")

                # Secondary string-distance check (Jaccard similarity) against recent jobs from same company
                cursor = await db.execute(
                    "SELECT job_hash, raw_jd_text FROM jobs_discovered WHERE company = ? AND processing_status != 'expired'",
                    (company,)
                )
                existing_jobs = await cursor.fetchall()
                for existing_hash, existing_jd in existing_jobs:
                    similarity = jaccard_similarity(raw_jd_text, existing_jd)
                    if similarity > 0.85:
                        log_event(logger, logging.INFO, f"Cross-posting variance trapped. Similarity {similarity:.2f}", job_hash, "db_insert", "duplicate_ignored")
                        return # Skip insertion, trap duplicate

                await db.execute("""
                    INSERT INTO jobs_discovered
                    (job_hash, company, title, url, processing_status, rubric_version, manual_override, raw_jd_text, discovered_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(job_hash) DO NOTHING
                """, (job_hash, company, title, url, "pending", rubric_version, False, raw_jd_text, now, now))
                await db.commit()
                log_event(logger, logging.INFO, "Job inserted/ignored successfully", job_hash, "db_insert", "pending")
        except Exception as e:
            log_event(logger, logging.ERROR, f"DB insert failed: {str(e)}", job_hash, "db_insert", "automation_failed")
            raise

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(5))
    async def update_status_optimistic(self, job_hash: str, new_status: str, expected_updated_at: str) -> str:
        """Updates the status only if the updated_at timestamp matches (Optimistic Concurrency Control)."""
        try:
            now = datetime.now(timezone.utc).isoformat()
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("PRAGMA journal_mode=WAL;")
                cursor = await db.execute(
                    "UPDATE jobs_discovered SET processing_status = ?, updated_at = ? WHERE job_hash = ? AND updated_at = ?",
                    (new_status, now, job_hash, expected_updated_at)
                )
                if cursor.rowcount == 0:
                    raise ValueError(f"Concurrency lock failure or job not found for hash: {job_hash}")
                await db.commit()
                log_event(logger, logging.INFO, f"Status updated to {new_status}", job_hash, "db_update", new_status)
                return now
        except Exception as e:
            log_event(logger, logging.ERROR, f"DB update failed: {str(e)}", job_hash, "db_update", "automation_failed")
            raise

    async def verify_assets_exist(self, job_hash: str, rubric_version: str) -> bool:
        """Retry guard checking if an output package exists for a target."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("PRAGMA journal_mode=WAL;")
            cursor = await db.execute(
                "SELECT 1 FROM jobs_discovered WHERE job_hash = ? AND rubric_version = ? AND processing_status IN ('staged', 'awaiting_hitl', 'submitted')",
                (job_hash, rubric_version)
            )
            result = await cursor.fetchone()
            return result is not None

    async def get_jobs_by_status(self, status: str) -> List[dict]:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("PRAGMA journal_mode=WAL;")
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM jobs_discovered WHERE processing_status = ?", (status,))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
