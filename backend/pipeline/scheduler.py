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


def _job_full():
    try:
        run_pipeline(full=True, live=True)
    except Exception:
        logger.exception("Weekly full pipeline failed")


def start():
    global _sched
    if _sched is not None:
        return _sched
    _sched = BackgroundScheduler(timezone="Asia/Ho_Chi_Minh")
    _sched.add_job(_job, "cron", hour=1, minute=0, id="nightly_pipeline", misfire_grace_time=3600)
    # Weekly full re-crawl: reconciles statuses of old events (e.g. a "Đăng ký"
    # that later completed) which the incremental scan never revisits.
    _sched.add_job(_job_full, "cron", day_of_week="sun", hour=2, minute=0,
                   id="weekly_full_pipeline", misfire_grace_time=3600)
    _sched.start()
    logger.info("Scheduler started (nightly 01:00 + weekly full Sun 02:00 Asia/Ho_Chi_Minh)")
    return _sched


def shutdown():
    global _sched
    if _sched is not None:
        _sched.shutdown(wait=False)
        _sched = None
