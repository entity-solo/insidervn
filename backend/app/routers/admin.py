"""Admin dashboard API — private, token-gated."""
from __future__ import annotations

import os
import time

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, text

from app import metrics
from app.database import SessionLocal

router = APIRouter(prefix="/api/admin", tags=["admin"])

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")


def _verify_token(authorization: str = Header(None)):
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="ADMIN_TOKEN not configured")
    if not authorization or authorization.removeprefix("Bearer ").strip() != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/dashboard")
def dashboard(_: str = Depends(_verify_token)):
    db = SessionLocal()
    try:
        # --- Pipeline ---
        rows = db.execute(text("SELECT key, value FROM app_meta WHERE key IN ('last_crawl_at','last_crawl_ok')")).all()
        meta = {r[0]: r[1] for r in rows}

        # --- Data health ---
        total = db.execute(text("SELECT count(*) FROM transactions")).scalar() or 0
        by_type = dict(db.execute(text("SELECT type, count(*) FROM transactions GROUP BY type")).all())
        price_cov = db.execute(text("SELECT count(DISTINCT ticker) FROM prices")).scalar() or 0
        wr_count = db.execute(text("SELECT count(*) FROM winrate")).scalar() or 0
        perf_cov = db.execute(text("SELECT count(*) FROM transactions WHERE perf_1m IS NOT NULL")).scalar() or 0

        # --- DB health ---
        t0 = time.time()
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - t0) * 1000, 1)

        # --- System ---
        try:
            import psutil
            mem = psutil.virtual_memory()
            sys_info = {
                "db_latency_ms": db_latency_ms,
                "memory_used_pct": mem.percent,
                "memory_used_gb": round(mem.used / 1e9, 1),
                "memory_total_gb": round(mem.total / 1e9, 1),
            }
        except ImportError:
            sys_info = {"db_latency_ms": db_latency_ms}

        return {
            "pipeline": {
                "last_crawl_at": meta.get("last_crawl_at"),
                "last_crawl_ok": meta.get("last_crawl_ok") == "1",
            },
            "data": {
                "total_transactions": total,
                "by_type": by_type,
                "price_tickers": price_cov,
                "winrate_insiders": wr_count,
                "perf_coverage": round(perf_cov / total * 100, 1) if total else 0,
            },
            "system": sys_info,
            "api": metrics.snapshot(),
        }
    finally:
        db.close()
