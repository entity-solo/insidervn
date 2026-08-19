"""APScheduler cron runner (nightly 01:00)."""
from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from .pipeline import run_pipeline

logger = logging.getLogger("pipeline.scheduler")

_sched: BackgroundScheduler | None = None


def _job():
    try:
        run_pipeline(full=False, live=True)
    except Exception:
        logger.exception("Scheduled pipeline failed")


def start():
    global _sched
    if _sched is not None:
        return _sched
    _sched = BackgroundScheduler()
    _sched.add_job(_job, "cron", hour=1, minute=0, id="nightly_pipeline", misfire_grace_time=3600)
    _sched.start()
    logger.info("Scheduler started (nightly 01:00)")
    return _sched


def shutdown():
    global _sched
    if _sched is not None:
        _sched.shutdown(wait=False)
        _sched = None
