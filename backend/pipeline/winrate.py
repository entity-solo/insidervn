"""Recompute the Win Rate leaderboard from the transactions table.

Definition (derived from enriched prices): for each insider, consider their
``buy`` transactions that have a known 1-month performance (``perf_1m``).
A trade is a "win" when ``perf_1m >= 0``. This is fully reproducible from the
DB, replacing the legacy static ``insider-winrates.json``.
"""
from __future__ import annotations

import json
import logging

from sqlalchemy import delete, select

from app.database import SessionLocal
from app.models.transaction import Transaction
from app.models.winrate import Winrate

logger = logging.getLogger("pipeline.winrate")


def recompute_winrates(db=None) -> int:
    own = db is None
    session = db or SessionLocal()
    try:
        rows = (
            session.execute(
                select(
                    Transaction.person,
                    Transaction.ticker,
                    Transaction.executed,
                    Transaction.shares,
                    Transaction.p_from,
                    Transaction.perf_1m,
                ).where(Transaction.type == "buy", Transaction.perf_1m != None)  # noqa: E711
            )
            .tuples()
            .all()
        )

        agg: dict[str, dict] = {}
        for person, ticker, executed, shares, p_from, perf_1m in rows:
            if not person:
                continue
            m = agg.setdefault(
                person, {"wins": 0, "losses": 0, "pnl_sum": 0.0, "value": 0.0, "tickers": set()}
            )
            if perf_1m >= 0:
                m["wins"] += 1
            else:
                m["losses"] += 1
            m["pnl_sum"] += perf_1m
            vol = executed if executed is not None else shares
            if p_from:
                m["value"] += (vol or 0) * p_from * (perf_1m / 100.0)
            m["tickers"].add(ticker)

        out = []
        for person, m in agg.items():
            total = m["wins"] + m["losses"]
            if total == 0:
                continue
            out.append(
                {
                    "person": person,
                    "wr": round(m["wins"] / total * 100, 1),
                    "wins": m["wins"],
                    "losses": m["losses"],
                    "total_trades": total,
                    "pnl": round(m["pnl_sum"] / total, 2),
                    "total": round(m["value"], 2),
                    "tickers": json.dumps(sorted(m["tickers"]), ensure_ascii=False),
                }
            )

        session.execute(delete(Winrate))
        if out:
            session.bulk_insert_mappings(Winrate, out)
        session.commit()
        logger.info("Recomputed winrates for %s insiders", len(out))
        return len(out)
    finally:
        if own:
            session.close()
