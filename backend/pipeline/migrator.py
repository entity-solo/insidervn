"""Normalize raw Vietstock records into Transaction rows and upsert to DB.

Ports the role/transaction mapping from the legacy ``migrate-vietstock.py`` and
adds idempotent upsert keyed by ``eventID`` so the pipeline can be re-run
safely (nightly) without creating duplicates.
"""
from __future__ import annotations

import json
import logging
import os
from collections import defaultdict

from sqlalchemy import select

from app.config import SOURCE_DIR
from app.database import SessionLocal
from app.models.transaction import Transaction

logger = logging.getLogger("pipeline.migrator")

MAPPING_FILE = os.path.join(SOURCE_DIR, "vietstock-migrated.json")


def map_role(position: str):
    if not position:
        return ("Người liên quan", "related")
    pos = position.lower()
    if "chủ tịch" in pos:
        return ("Chủ tịch HĐQT", "chairman")
    if "tổng giám đốc" in pos or "tong giam doc" in pos:
        return ("Tổng Giám đốc", "ceo")
    if "phó tổng" in pos or "pho tong" in pos:
        return ("Phó Tổng Giám đốc", "ceo")
    if "kế toán" in pos or "ke toan" in pos:
        return ("Kế toán trưởng", "cfo")
    if "giám đốc" in pos or "giam doc" in pos:
        return ("Giám đốc", "ceo")
    if "thành viên hđqt" in pos or "tv hđqt" in pos:
        return ("Thành viên HĐQT", "board")
    if "kiểm soát" in pos or "kiem soat" in pos:
        return ("Kiểm soát viên", "board")
    if "cổ đông lớn" in pos or "co dong lon" in pos:
        return ("Cổ đông lớn", "major")
    if "quỹ" in pos or "fund" in pos:
        return ("Quỹ đầu tư", "fund")
    if "người liên quan" in pos or "nguoi lien quan" in pos:
        return ("Người liên quan", "related")
    if "nội bộ" in pos or "noi bo" in pos:
        return ("Người nội bộ", "insider")
    return (position, "insider")


def map_transaction(vs_rec: dict):
    status = vs_rec.get("status", "")
    is_result = status == "Kết quả"
    register_buy = vs_rec.get("registerBuy", 0) or 0
    actual_buy = vs_rec.get("actualBuy", 0) or 0
    register_sell = vs_rec.get("registerSell", 0) or 0
    actual_sell = vs_rec.get("actualSell", 0) or 0

    if actual_buy > 0 or register_buy > 0:
        tx_type = "buy"
        if is_result:
            shares = register_buy or actual_buy
            executed = actual_buy
        else:
            shares = register_buy
            executed = None if actual_buy == 0 else actual_buy
    elif actual_sell > 0 or register_sell > 0:
        tx_type = "sell"
        if is_result:
            shares = register_sell or actual_sell
            executed = actual_sell
        else:
            shares = register_sell
            executed = None if actual_sell == 0 else actual_sell
    else:
        return None
    return (tx_type, shares, executed)


def load_ticker_info(path: str | None = None) -> dict:
    path = path or MAPPING_FILE
    info: dict[str, tuple] = {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return info
    for r in data:
        t = r.get("ticker")
        if t and t not in info:
            info[t] = (r.get("company"), r.get("exchange"))
    return info


def _to_row(rec: dict, ticker_info: dict, id_counter: int) -> dict | None:
    tx = map_transaction(rec)
    if not tx:
        return None
    tx_type, shares, executed = tx
    role, role_key = map_role(rec.get("position", ""))
    ticker = rec.get("ticker", "")
    if not ticker:
        return None
    company, exchange = ticker_info.get(ticker, (None, None))
    if not company:
        company = ticker
    if not exchange:
        exchange = ""
    date_reg = rec.get("planBegin") or rec.get("planEnd") or ""
    return {
        "id": id_counter,
        "ticker": ticker,
        "company": company,
        "exchange": exchange,
        "person": rec.get("person", ""),
        "role": role,
        "role_key": role_key,
        "type": tx_type,
        "shares": shares,
        "executed": executed,
        "p_from": None,
        "p_to": None,
        "date_reg": date_reg,
        "date_from": rec.get("planBegin") or "",
        "date_to": rec.get("planEnd") or "",
        "source": "vietstock",
        "event_id": int(rec.get("eventID")) if str(rec.get("eventID", "")).strip() else None,
        "status": rec.get("status", ""),
        "type_name": rec.get("typeName", ""),
        "relationship": rec.get("relationship", ""),
        "vol_before": rec.get("volBefore") or 0,
        "vol_after": rec.get("volAfter") or 0,
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
        out.append(row)
        id_counter += 1
    logger.info("Migrated %s records (skipped %s)", len(out), skipped)
    return out


def _coerce_eid(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return v


def upsert_transactions(rows: list[dict], db=None) -> tuple[int, int]:
    own = db is None
    session = db or SessionLocal()
    try:
        # event_id stored as Integer; coerce both sides so string/int mismatch
        # (e.g. from parsed records) doesn't wrongly flag rows as new inserts.
        existing = {_coerce_eid(eid): tid for eid, tid in session.execute(select(Transaction.event_id, Transaction.id)).all()}
        to_insert, to_update = [], []
        for r in rows:
            eid = _coerce_eid(r.get("event_id"))
            if eid is not None and eid in existing:
                r = dict(r)
                r["id"] = existing[eid]
                to_update.append(r)
            else:
                r = dict(r)
                r.pop("id", None)  # let the DB assign a fresh primary key
                to_insert.append(r)
        if to_insert:
            session.bulk_insert_mappings(Transaction, to_insert)
        if to_update:
            session.bulk_update_mappings(Transaction, to_update)
        session.commit()
        logger.info("Upsert transactions: +%s new, ~%s updated", len(to_insert), len(to_update))
        return len(to_insert), len(to_update)
    finally:
        if own:
            session.close()
