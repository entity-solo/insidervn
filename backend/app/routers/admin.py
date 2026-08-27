"""Admin dashboard API — private, token-gated."""
from __future__ import annotations

import os
import time
from datetime import datetime, timedelta
from functools import lru_cache

import requests
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, text

from app import metrics
from app.database import SessionLocal

router = APIRouter(prefix="/api/admin", tags=["admin"])

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")
VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN", "")
VERCEL_PROJECT_ID = os.environ.get("VERCEL_PROJECT_ID", "prj_W1IMhOFkeNbAKo1BQpqIGsQQ2tn6")
VERCEL_TEAM_ID = os.environ.get("VERCEL_TEAM_ID", "team_izjXDEFPwNix14ER7kae8DOj")

_analytics_base = "https://api.vercel.com/v1/query/web-analytics"


def _verify_token(authorization: str = Header(None)):
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="ADMIN_TOKEN not configured")
    if not authorization or authorization.removeprefix("Bearer ").strip() != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")


def _va_get(path: str, params: dict) -> dict | None:
    """Query Vercel Analytics API. Returns None on failure."""
    if not VERCEL_TOKEN:
        return None
    try:
        params["projectId"] = VERCEL_PROJECT_ID
        params["teamId"] = VERCEL_TEAM_ID
        r = requests.get(
            f"{_analytics_base}/{path}",
            headers={"Authorization": f"Bearer {VERCEL_TOKEN}"},
            params=params,
            timeout=15,
        )
        if r.ok:
            return r.json()
    except Exception:
        pass
    return None


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
        wr_count = db.execute(text("SELECT count(*) FROM winrates")).scalar() or 0
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

        # --- Traffic (Vercel Analytics) ---
        until = datetime.utcnow().strftime("%Y-%m-%d")
        since_30d = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        since_7d = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")

        traffic: dict = {"enabled": bool(VERCEL_TOKEN)}

        if VERCEL_TOKEN:
            # Totals
            t30 = _va_get("visits/count", {"since": since_30d, "until": until})
            t7 = _va_get("visits/count", {"since": since_7d, "until": until})
            traffic["total_30d"] = t30.get("data", {}) if t30 else {}
            traffic["total_7d"] = t7.get("data", {}) if t7 else {}

            # Daily trend (14d)
            since_14d = (datetime.utcnow() - timedelta(days=14)).strftime("%Y-%m-%d")
            daily = _va_get("visits/aggregate", {"since": since_14d, "until": until, "by": "day"})
            traffic["daily"] = daily.get("data", []) if daily else []

            # Top pages (30d)
            pages = _va_get("visits/aggregate", {"since": since_30d, "until": until, "by": "route", "limit": 10})
            traffic["top_pages"] = pages.get("data", []) if pages else []

            # Top referrers (30d)
            refs = _va_get("visits/aggregate", {"since": since_30d, "until": until, "by": "referrerHostname", "limit": 8})
            traffic["top_referrers"] = refs.get("data", []) if refs else []

            # Countries (30d)
            countries = _va_get("visits/aggregate", {"since": since_30d, "until": until, "by": "country", "limit": 8})
            traffic["top_countries"] = countries.get("data", []) if countries else []

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
            "traffic": traffic,
        }
    finally:
        db.close()
