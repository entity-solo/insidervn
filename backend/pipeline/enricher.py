"""Price enrichment + performance calculation.

Computes ``perf_1w``, ``perf_1m`` and ``dip`` for every transaction and stores
the weekly price series in the ``prices`` table.

Two price sources:
- Offline (default in this repo): read ``price-cache-full.json``
  (``{ticker: {date: close}}``).
- Live: fetch via ``vnstock`` with throttling + retry (lazy import so the
  offline path never requires the heavy dependency).
"""
from __future__ import annotations

import json
import logging
import os
import time
import bisect
from datetime import date, datetime, timedelta

from sqlalchemy import select, text

from app.config import SOURCE_DIR
from app.database import SessionLocal
from app.models.price import Price
from app.models.transaction import Transaction

logger = logging.getLogger("pipeline.enricher")

CACHE_FILE = os.path.join(SOURCE_DIR, "price-cache-full.json")
WEEK_START = datetime(2020, 1, 1).date()
WEEK_END = date(datetime.now().year, 12, 31)


# ---------- price helpers (ported from legacy enrich-data.py) ----------
def _price_at(hist: dict, date_str: str):
    if not hist or not date_str:
        return None
    if date_str in hist:
        return hist[date_str]
    dates = sorted(hist.keys())
    for d in reversed(dates):
        if d <= date_str:
            return hist[d]
    return None


def _price_after(hist: dict, date_str: str, days: int):
    if not hist or not date_str:
        return None
    base = datetime.strptime(date_str, "%Y-%m-%d")
    target = (base + timedelta(days=days)).strftime("%Y-%m-%d")
    if target in hist:
        return hist[target]
    for d in sorted(hist.keys()):
        if d >= target:
            return hist[d]
    return None


def _max_drawdown_before(hist: dict, date_str: str, lookback: int = 28) -> float:
    if not hist or not date_str:
        return 0.0
    base = datetime.strptime(date_str, "%Y-%m-%d")
    start = (base - timedelta(days=lookback)).strftime("%Y-%m-%d")
    dates = sorted(d for d in hist.keys() if start <= d <= date_str)
    if len(dates) < 2:
        return 0.0
    prices = [hist[d] for d in dates]
    peak, mdd = prices[0], 0.0
    for p in prices:
        if p > peak:
            peak = p
        dd = (p - peak) / peak if peak else 0
        if dd < mdd:
            mdd = dd
    return round(mdd * 100, 2)


def _chunked(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def _price_at_sorted(h: dict, sd: list, date_str: str):
    if not sd or not date_str:
        return None
    i = bisect.bisect_right(sd, date_str) - 1
    if i >= 0:
        return h[sd[i]]
    return None


def _price_after_sorted(h: dict, sd: list, date_str: str, days: int):
    if not sd or not date_str:
        return None
    base = datetime.strptime(date_str, "%Y-%m-%d")
    target = (base + timedelta(days=days)).strftime("%Y-%m-%d")
    i = bisect.bisect_left(sd, target)
    if i < len(sd):
        return h[sd[i]]
    return None


def _price_before_sorted(h: dict, sd: list, date_str: str):
    if not sd or not date_str:
        return None
    i = bisect.bisect_right(sd, date_str) - 1
    if i >= 0:
        return h[sd[i]]
    return None


def _rally_before(hist: dict, sd: list, date_str: str, lookback: int = 28):
    """% price change over the `lookback` days before a sell (mirrors dip)."""
    p1 = _price_before_sorted(hist, sd, date_str)
    if not p1:
        return None
    base = datetime.strptime(date_str, "%Y-%m-%d")
    tgt = (base - timedelta(days=lookback)).strftime("%Y-%m-%d")
    p0 = _price_before_sorted(hist, sd, tgt)
    if not p0 or p0 <= 0:
        return None
    return round((p1 - p0) / p0 * 100, 2)


def _bulk_update_perf(session, updates, chunk: int = 500):
    """Update perf columns in chunks using a plain multi-row UPDATE.

    ``bulk_update_mappings`` hangs on Supabase's transaction-pooler (pgbouncer
    in transaction mode); a single parameterized UPDATE ... FROM (VALUES) is
    pooler-friendly and commits per chunk."""
    for part in _chunked(updates, chunk):
        vals = []
        params = {}
        for i, u in enumerate(part):
            vals.append(f"(:id{i}, :w{i}, :m{i}, :d{i}, :r{i})")
            params[f"id{i}"] = u["id"]
            params[f"w{i}"] = u["perf_1w"]
            params[f"m{i}"] = u["perf_1m"]
            params[f"d{i}"] = u["dip"]
            params[f"r{i}"] = u["rally"]
        sql = (
            "UPDATE transactions AS t "
            "SET perf_1w=v.perf_1w::double precision, "
            "perf_1m=v.perf_1m::double precision, "
            "dip=v.dip::double precision, "
            "rally=v.rally::double precision "
            "FROM (VALUES " + ", ".join(vals) + ") AS v(id, perf_1w, perf_1m, dip, rally) "
            "WHERE t.id=v.id"
        )
        session.execute(text(sql), params)
        session.commit()


def _week_dates():
    d = WEEK_START
    out = []
    while d <= WEEK_END:
        out.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=7)
    return out


def build_weekly_series(hist: dict) -> tuple[list[str], dict[str, list]]:
    week = _week_dates()
    series: dict[str, list] = {}
    for tk, h in hist.items():
        sd = sorted(h.keys())
        if not sd:
            continue
        arr: list = []
        idx = 0
        for wd in week:
            while idx < len(sd) - 1 and sd[idx + 1] <= wd:
                idx += 1
            arr.append(h[sd[idx]] if sd[idx] <= wd else None)
        while arr and arr[-1] is None:
            arr.pop()
        series[tk] = arr
    return week, series


# ---------- price sources ----------
def load_price_cache(path: str | None = None) -> dict:
    path = path or CACHE_FILE
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning("Could not load price cache %s: %s", path, e)
        return {}


def fetch_prices_live(all_tickers: list[str], cap: int = 760, existing: set[str] | None = None) -> dict:
    from vnstock.api.quote import Quote  # lazy import

    cache: dict = {}
    last = time.time()
    todo = [t for t in all_tickers if t not in cache and (existing is None or t not in existing)][:cap]
    for t in todo:
        now = time.time()
        wait = 3.4 - (now - last)
        if wait > 0:
            time.sleep(wait)
        try:
            df = Quote(symbol=t, source="KBS").history(start="2020-01-01", end=f"{datetime.now().year}-12-31")
            if df is None or len(df) == 0:
                cache[t] = {}
                continue
            out = {}
            for tm, c in zip(df["time"], df["close"]):
                if c is None:
                    continue
                d = tm.strftime("%Y-%m-%d") if hasattr(tm, "strftime") else str(tm)[:10]
                out[d] = round(float(c) * 1000, 2)
            cache[t] = out
        except Exception as e:
            err = str(e).lower()
            if "limit" in err or "rate" in err or "429" in err:
                logger.warning("Rate limit on %s, backing off 60s", t)
                time.sleep(60)
                continue
            logger.warning("Price fetch failed for %s: %s", t, err[:80])
            cache[t] = {}
        last = time.time()
    return cache


# ---------- enrichment ----------
def enrich(db=None, offline: bool = True, cache_path: str | None = None) -> dict:
    own = db is None
    session = db or SessionLocal()
    try:
        hist = load_price_cache(cache_path) if offline else {}
        if not offline:
            tickers = [t for (t,) in session.execute(select(Transaction.ticker).distinct()).all()]
            existing_tickers = set(session.execute(select(Price.ticker)).scalars().all())
            hist = fetch_prices_live(tickers, existing=existing_tickers)

        rows = session.execute(select(Transaction)).scalars().all()
        updates = []
        hit = 0
        sorted_cache = {}
        for d in rows:
            tk = d.ticker
            h = hist.get(tk)
            if not h:
                continue
            sd = sorted_cache.get(tk)
            if sd is None:
                sd = sorted(h.keys())
                sorted_cache[tk] = sd
            tdate = d.date_from or d.date_reg
            pt = _price_at_sorted(h, sd, tdate)
            if not pt:
                continue
            hit += 1
            p1 = _price_after_sorted(h, sd, tdate, 7)
            p2 = _price_after_sorted(h, sd, tdate, 30)
            perf_1w = round((p1 - pt) / pt * 100, 1) if p1 else None
            perf_1m = round((p2 - pt) / pt * 100, 1) if p2 else None
            dip = None
            rally = None
            if d.type and "buy" in d.type:
                dip = _max_drawdown_before(h, tdate)
            elif d.type and "sell" in d.type:
                rally = _rally_before(h, sd, tdate)
            updates.append({"id": d.id, "perf_1w": perf_1w, "perf_1m": perf_1m, "dip": dip, "rally": rally})
        if updates:
            _bulk_update_perf(session, updates, chunk=500)
        logger.info("Enriched %s/%s transactions with prices", hit, len(rows))

        # weekly price series -> prices table
        week, series = build_weekly_series(hist)
        existing = set(session.execute(select(Price.ticker)).scalars().all())
        to_insert, to_update = [], []
        for tk, vals in series.items():
            row = {
                "ticker": tk,
                "dates": json.dumps(week, ensure_ascii=False),
                "values": json.dumps(vals, ensure_ascii=False),
            }
            if tk in existing:
                to_update.append(row)
            else:
                to_insert.append(row)
        for part in _chunked(to_insert, 500):
            session.bulk_insert_mappings(Price, part)
            session.commit()
        for part in _chunked(to_update, 500):
            session.bulk_update_mappings(Price, part)
            session.commit()
        logger.info("Price series stored for %s tickers", len(series))
        return {"enriched": hit, "total": len(rows), "prices": len(series)}
    finally:
        if own:
            session.close()
