"""Fetch outstanding shares from vnstock for tickers missing from the tickers table."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from sqlalchemy import text

from app.database import SessionLocal
from app.models.ticker import Ticker

logger = logging.getLogger("pipeline.ticker_updater")

BATCH_SIZE = 80  # ~4.5 min per batch at 3.4s/ticker


def refresh_tickers(session=None) -> dict:
    own = session is None
    session = session or SessionLocal()
    try:
        # Find tickers referenced in transactions but missing from tickers table
        rows = session.execute(text(
            "SELECT DISTINCT t.ticker FROM transactions t "
            "LEFT JOIN tickers tk ON tk.ticker = t.ticker "
            "WHERE tk.ticker IS NULL "
            "ORDER BY t.ticker"
        )).fetchall()
        missing = [r[0] for r in rows]

        if not missing:
            logger.info("refresh_tickers: all tickers have outstanding_shares data")
            return {"fetched": 0, "total": 0}

        batch = missing[:BATCH_SIZE]
        logger.info("refresh_tickers: fetching %s/%s tickers", len(batch), len(missing))

        from vnstock.api.company import Company

        fetched = 0
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        for sym in batch:
            try:
                c = Company(symbol=sym, source="KBS")
                df = c.overview()
                if df is None or len(df) == 0:
                    continue
                row = df.iloc[0]
                shares = row.get("outstanding_shares")
                if shares is not None and shares > 0:
                    session.merge(Ticker(
                        ticker=sym,
                        outstanding_shares=float(shares),
                        updated_at=now,
                    ))
                    fetched += 1
            except Exception as e:
                logger.warning("Failed to fetch %s: %s", sym, str(e)[:80])
            time.sleep(3.4)  # rate limit

        session.commit()
        logger.info("refresh_tickers: fetched %s tickers", fetched)
        return {"fetched": fetched, "remaining": len(missing) - len(batch), "total": len(missing)}
    finally:
        if own:
            session.close()
