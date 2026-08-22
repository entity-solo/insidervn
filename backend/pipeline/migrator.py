"""Migrate raw vietstock data into normalized Transaction rows, and push
them (plus derived win-rates and prices) into the database.

Two source paths are supported:
  * live scrape (vietstock XML) via `migrate()`
  * offline legacy snapshot `vietstock-migrated.json` via `migrate_legacy()`

Reference data (ticker info, price history) is loaded from local files when
available, otherwise downloaded from REFERENCE_BASE_URL (set in production to
the GitHub raw URL so the container need not bundle multi-MB files).
"""

import os
import re
import json
import gzip
import logging
from datetime import datetime
from sqlalchemy import select, text

from app.database import SessionLocal
from app.models.transaction import Transaction
from app.models.price import Price
import requests

logger = logging.getLogger("pipeline.migrator")

SOURCE_DIR = os.environ.get("SOURCE_DIR", os.path.join(os.path.dirname(__file__), "..", ".."))
REFERENCE_BASE_URL = os.environ.get("REFERENCE_BASE_URL", "")


def _loglevel():
    import sys
    return logging.DEBUG if "-v" in sys.argv else logging.INFO


logging.basicConfig(level=_loglevel())


def _decode_text(data, enc="utf-8"):
    return data.decode(enc)


def _parse_json(raw):
    if isinstance(raw, (bytes, bytearray)):
        data = bytes(raw)
        if data[:2] == b"\x1f\x8b":
            data = gzip.decompress(data)
        return json.loads(data.decode("utf-8"))
    if raw is None:
        return None
    return _load_json_compat(raw)


def _load_json_compat(path):
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning("Failed to read %s: %s", path, e)
        return None


def load_ticker_info():
    """ticker -> {sector, industry, group, market_cap, ...}

    Optional enrichment: if the file is unavailable we continue without it
    instead of failing the whole pipeline run."""
    try:
        return _parse_json(_reference_path("tickerinfo.json")) or {}
    except FileNotFoundError as e:
        logger.warning("tickerinfo.json unavailable, continuing without it: %s", e)
        return {}


def load_price_cache():
    """Return {ticker: [(date, close), ...]} from price-cache-full.json(.gz)."""
    data = _parse_json(_reference_path("price-cache-full.json"))
    if not data:
        return {}
    cache = {}
    for ticker, series in data.items():
        if isinstance(series, dict) and "dates" in series and "values" in series:
            cache[ticker] = list(zip(series["dates"], series["values"]))
        elif isinstance(series, list):
            cache[ticker] = series
    return cache


def _reference_path(name):
    """Resolve a reference file: local SOURCE_DIR first, else remote URL (bytes)."""
    local = os.path.join(SOURCE_DIR, name)
    if os.path.exists(local):
        return local
    gz = os.path.join(SOURCE_DIR, name + ".gz")
    if os.path.exists(gz):
        return gz
    references = []
    if REFERENCE_BASE_URL:
        references.append(REFERENCE_BASE_URL.rstrip("/") + "/" + name)
        references.append(REFERENCE_BASE_URL.rstrip("/") + "/" + name + ".gz")
    for url in references:
        try:
            r = requests.get(url, timeout=30)
            if r.ok:
                return r.content
        except Exception as e:
            logger.warning("Reference download failed %s: %s", url, e)
    raise FileNotFoundError(f"Reference not found locally or remotely: {name}")


def load_migrated_records():
    """Load the pre-normalized legacy snapshot (vietstock-migrated.json[.gz])."""
    raw = _reference_path("vietstock-migrated.json")
    return _parse_json(raw)


_ORG_RE = re.compile(
    r"công ty|ctcp|tập đoàn|tổng công ty|tnhh|tmcp|quỹ|ngân hàng|bảo hiểm|"
    r"nhóm cđ|nhóm cdl|công đoàn|quản lý quỹ|"
    r"ltd|llc|pte|\bag\b|plc|gmbh|limited|group|corp|corporation|holdings|"
    r"capital|partners|invest|fund|ucits|beteilgungen|am[eé]rica|\bsa\b|\bnv\b|\bbv\b",
    re.I,
)


def _is_org(person: str, relationship: str) -> bool:
    p = (person or "").strip()
    if not p or p.lower() == "blank":
        return False
    if relationship and relationship.strip():
        return False
    return bool(_ORG_RE.search(p))


def _classify_role(type_name: str, person: str, relationship: str, role_raw: str, role_key_raw: str):
    tn = (type_name or "").strip()
    if tn == "GD CĐ lớn":
        return "shareholder", "Cổ đông lớn"
    if tn == "GD CĐ nội bộ":
        return "internal", "Cổ đông nội bộ"
    if tn == "GD cổ phiếu quỹ":
        return "treasury", "Cổ phiếu quỹ"
    if tn == "GD của người liên quan":
        return "related", ("Tổ chức liên quan" if _is_org(person, relationship) else "Người liên quan")
    return (role_key_raw or "insider"), (role_raw or "Người nội bộ")


def _to_row(rec, ticker_info, id_counter):
    """Normalize a single raw vietstock record into a Transaction row dict."""
    def g(*keys, default=""):
        for k in keys:
            if isinstance(rec, dict) and k in rec and rec[k] not in (None, ""):
                return rec[k]
        return default

    ticker = str(g("ticker", "symbol") or "").strip().upper()
    if not ticker:
        return None
    raw_event = g("eventID", "eventId", "EventID")
    try:
        event_id = int(raw_event) if raw_event not in (None, "") else None
    except (TypeError, ValueError):
        event_id = None

    # Scraper-parsed Vietstock shape carries registerBuy/actualBuy/... instead
    # of a ready-made type/shares/executed triple — derive them here.
    # shares = registered (planned) volume; executed = actually traded only,
    # so pending registrations keep executed NULL and show as "Đăng ký".
    rb, ab = _as_int(g("registerBuy")), _as_int(g("actualBuy"))
    rs, asl = _as_int(g("registerSell")), _as_int(g("actualSell"))
    tx_type = str(g("type_raw", "type") or "")
    shares_v: object = g("shares", "volume", "quantity")
    executed_v: object = g("executed")
    if not tx_type and (rb or ab or rs or asl):
        is_buy = bool(ab or rb)
        tx_type = "buy" if is_buy else "sell"
        if shares_v in (None, ""):
            shares_v = rb if is_buy else rs
        if executed_v in (None, ""):
            executed_v = ab if is_buy else asl
    # A record still marked "Đăng ký" has not been confirmed executed by the
    # source — keep its volume as registered only so it renders as pending.
    if str(g("status", "Status") or "").strip() == "Đăng ký":
        if executed_v not in (None, "") and (shares_v in (None, "", 0)):
            shares_v = executed_v
        executed_v = None

    info = (ticker_info or {}).get(ticker, {}) or {}
    person_val = str(g("person", "insider") or "")
    rel_val = str(g("relationship", "relation") or "")
    tn_val = str(g("type", "transactionType", "typeName") or "")
    role_key_val, role_val = _classify_role(
        tn_val, person_val, rel_val, g("role", "position"), g("roleKey", "role_key")
    )
    # Related-party trades: surface who is linked and their position, e.g.
    # "Người liên quan · CTHĐQT · Đặng Thành Tâm".
    if role_key_val == "related":
        bits = [b for b in [
            role_val,
            str(g("role", "position") or ""),
            str(g("linkedPerson") or ""),
        ] if b]
        if bits:
            role_val = " · ".join(bits)
    person_type_val = (
        "org"
        if _is_org(person_val, rel_val)
        else ("person" if person_val.strip() and person_val.strip().lower() != "blank" else None)
    )
    date_from = str(g("date_from", "fromDate", "dateFrom", "planBegin") or "")
    date_to = str(g("date_to", "toDate", "dateTo", "planEnd") or "")
    date_reg = str(g("date_reg", "registeredDate", "dateReg", "buyExpected", "sellExpected") or "")
    # Source sometimes swaps the window ends (e.g. 2025-12-24 -> 2025-01-22).
    if date_from and date_to and date_from > date_to:
        date_from, date_to = date_to, date_from
    # Treasury buybacks are executed by the company itself; the source puts
    # funding-source labels ("Vốn tự có") in the person fields.
    if tn_val == "GD cổ phiếu quỹ":
        person_val = ""
        rel_val = ""
        person_type_val = None
    else:
        person_type_val = (
            "org"
            if _is_org(person_val, rel_val)
            else ("person" if person_val.strip() and person_val.strip().lower() != "blank" else None)
        )
    # Negative volumes are source typos — treat as unknown.
    if executed_v is not None and _as_int(executed_v) is not None and _as_int(executed_v) < 0:
        executed_v = None
    if shares_v is not None and _as_int(shares_v) is not None and _as_int(shares_v) < 0:
        shares_v = None
    # ANY record whose action date lies in the future (e.g. planned
    # ownership-change reports) cannot have been executed yet.
    _action_day = date_from or date_reg
    if _action_day and executed_v not in (None, ""):
        try:
            if datetime.strptime(_action_day[:10], "%Y-%m-%d").date() > datetime.now().date():
                if shares_v in (None, "", 0):
                    shares_v = executed_v
                executed_v = None
        except ValueError:
            pass
    return {
        "id": id_counter,
        "ticker": ticker,
        "company": str(g("company", "organization") or info.get("company") or ticker),
        "exchange": str(g("exchange", "market") or info.get("exchange") or "").replace("UPCOM", "UPCoM"),
        "person": person_val,
        "role": role_val,
        "role_key": role_key_val,
        "person_type": person_type_val,
        "type": tx_type,
        "shares": _as_int(shares_v),
        "executed": _as_int(executed_v),
        "p_from": _as_float(g("p_from", "priceBefore")),
        "p_to": _as_float(g("p_to", "priceAfter")),
        "date_reg": date_reg or date_from,
        "date_from": date_from,
        "date_to": date_to,
        "source": str(g("source", "Source") or "vietstock"),
        "event_id": event_id,
        "status": str(g("status", "Status") or ""),
        "type_name": tn_val,
        "relationship": rel_val,
        "vol_before": _as_int(g("volBefore", "volumeBefore")),
        "vol_after": _as_int(g("volAfter", "volumeAfter")),
    }


def migrate(raw_records: list[dict], ticker_info: dict | None = None) -> list[dict]:
    ticker_info = ticker_info if ticker_info is not None else load_ticker_info()
    out = []
    id_counter = 1
    skipped = 0
    for rec in raw_records:
        row = _to_row(rec, ticker_info, id_counter)
        if row is None:
            skipped += 1
            continue
        out.append(_sanitize_row(row))
        id_counter += 1
    logger.info("Migrated %s records (skipped %s)", len(out), skipped)
    return out


def _as_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _as_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


_DATE_FIELDS = ["date_reg", "date_from", "date_to"]

_MAX_VALID_YEAR = datetime.now().year


def _sanitize_row(row: dict) -> dict:
    """Fix implausible years. Vietstock sometimes returns a start/action date
    whose year is off (e.g. 2032) while the sibling end date is correct (2023).
    Any year in the future is rewritten to the year of a valid sibling date in
    the same record, keeping start <= end."""
    valid = []
    for f in _DATE_FIELDS:
        v = row.get(f)
        if isinstance(v, str):
            m = re.match(r"(\d{4})-", v)
            if m and int(m.group(1)) <= _MAX_VALID_YEAR:
                valid.append(int(m.group(1)))
    if not valid:
        return row
    for f in _DATE_FIELDS:
        v = row.get(f)
        if isinstance(v, str):
            m = re.match(r"(\d{4})-(\d{2})-(\d{2})", v)
            if m and int(m.group(1)) > _MAX_VALID_YEAR:
                row[f] = f"{valid[0]}-{m.group(2)}-{m.group(3)}"
    return row


def migrate_legacy(records: list[dict]) -> list[dict]:
    """Convert the pre-normalized legacy snapshot (vietstock-migrated.json)
    into Transaction rows. Those records already carry roleKey/typeName/etc.
    """
    out = []
    skipped = 0
    for i, rec in enumerate(records, 1):
        ticker = (rec.get("ticker") or "").strip()
        if not ticker:
            skipped += 1
            continue
        eid = rec.get("eventID")
        try:
            eid = int(eid) if eid not in (None, "") else None
        except (TypeError, ValueError):
            eid = None
        row = {
            "id": i,
            "ticker": ticker,
            "company": rec.get("company") or ticker,
            "exchange": rec.get("exchange") or "",
            "person": rec.get("person") or "",
            "role": rec.get("role") or "",
            "role_key": rec.get("roleKey") or "insider",
            "type": rec.get("type") or "",
            "shares": _as_int(rec.get("shares")),
            "executed": _as_int(rec.get("executed")),
            "p_from": _as_float(rec.get("p_from")),
            "p_to": _as_float(rec.get("p_to")),
            "date_reg": rec.get("date_reg") or "",
            "date_from": rec.get("date_from") or "",
            "date_to": rec.get("date_to") or "",
            "source": rec.get("source") or "vietstock",
            "event_id": eid,
            "status": rec.get("status") or "",
            "type_name": rec.get("typeName") or "",
            "relationship": rec.get("relationship") or "",
            "vol_before": _as_int(rec.get("volBefore")),
            "vol_after": _as_int(rec.get("volAfter")),
        }
        out.append(_sanitize_row(row))
    logger.info("Migrated (legacy) %s records (skipped %s)", len(out), skipped)
    return out


def _coerce_eid(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _chunked(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


_UPDATABLE_COLS = [
    ("ticker", None), ("company", None), ("exchange", None), ("person", None),
    ("role", None), ("role_key", None), ("person_type", None), ("type", None),
    ("shares", "::bigint"), ("executed", "::bigint"),
    ("p_from", "::double precision"), ("p_to", "::double precision"),
    ("date_reg", None), ("date_from", None), ("date_to", None),
    ("source", None), ("status", None), ("type_name", None),
    ("relationship", None), ("vol_before", "::bigint"), ("vol_after", "::bigint"),
]


def _bulk_update_transactions(session, rows, chunk: int = 300):
    """Pooler-friendly multi-row UPDATE (bulk_update_mappings hangs on
    Supabase's transaction-pooler). Casts keep NULL params type-safe.
    Price columns fall back to the existing value so a re-migrate of raw
    records (which carry no prices) never wipes known-good data."""
    cols = [c for c, _ in _UPDATABLE_COLS]
    casts = dict(_UPDATABLE_COLS)
    coalesce_cols = {"p_from", "p_to"}
    for part in _chunked(rows, chunk):
        vals, params = [], {}
        for i, r in enumerate(part):
            ph = ", ".join(f":c{j}_{i}" for j in range(len(cols)))
            vals.append(f"(:id_{i}, {ph})")
            params[f"id_{i}"] = r["id"]
            for j, c in enumerate(cols):
                params[f"c{j}_{i}"] = r.get(c)
        sets = ", ".join(
            f"{c}=COALESCE(v.{c}{casts[c] or ''}, t.{c})" if c in coalesce_cols else f"{c}=v.{c}{casts[c] or ''}"
            for c in cols
        )
        sql = (
            "UPDATE transactions AS t SET " + sets +
            " FROM (VALUES " + ", ".join(vals) + ") AS v(id, " + ", ".join(cols) + ") "
            "WHERE t.id=v.id"
        )
        session.execute(text(sql), params)
        session.commit()


def upsert_transactions(rows: list[dict], db=None, chunk: int = 2000) -> tuple[int, int]:
    own = db is None
    session = db or SessionLocal()
    try:
        existing = {_coerce_eid(eid): tid for eid, tid in
                    session.execute(select(Transaction.event_id, Transaction.id)).all()}
        to_insert, to_update = [], []
        for r in rows:
            eid = _coerce_eid(r.get("event_id"))
            if eid is not None and eid in existing:
                r = dict(r)
                r["id"] = existing[eid]
                to_update.append(r)
            else:
                r = dict(r)
                r.pop("id", None)
                to_insert.append(r)
        for part in _chunked(to_insert, chunk):
            session.bulk_insert_mappings(Transaction, part)
            session.commit()
        _bulk_update_transactions(session, to_update, chunk=300)
        logger.info("Upsert transactions: +%s new, ~%s updated", len(to_insert), len(to_update))
        return len(to_insert), len(to_update)
    finally:
        if own:
            session.close()


def upsert_prices(rows: list[dict], db=None, chunk: int = 500) -> tuple[int, int]:
    own = db is None
    session = db or SessionLocal()
    try:
        existing = {t for t in session.execute(select(Price.ticker)).scalars().all()}
        to_insert, to_update = [], []
        for r in rows:
            ticker = r.get("ticker")
            if ticker in existing:
                to_update.append(r)
            else:
                to_insert.append(r)
        for part in _chunked(to_insert, chunk):
            session.bulk_insert_mappings(Price, part)
            session.commit()
        for part in _chunked(to_update, chunk):
            session.bulk_update_mappings(Price, part)
            session.commit()
        logger.info("Upsert prices: +%s new, ~%s updated", len(to_insert), len(to_update))
        return len(to_insert), len(to_update)
    finally:
        if own:
            session.close()


def load_transactions(db=None):
    own = db is None
    session = db or SessionLocal()
    try:
        return session.execute(select(Transaction)).scalars().all()
    finally:
        if own:
            session.close()
