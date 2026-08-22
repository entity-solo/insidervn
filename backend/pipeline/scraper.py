"""Vietstock insider-trading scraper.

Fetches raw insider disclosure records from finance.vietstock.vn with:
- CSRF token auto-discovery + periodic refresh
- Exponential backoff retry
- Resumption (skip already-seen records via eventID / composite key)
- Offline fallback: when ``live=False`` (or the network is unavailable) the
  scraper loads an existing raw JSON file instead of hitting the network.

Raw records are saved under ``data/raw/vietstock-insider-raw.json``.
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
from datetime import datetime, timedelta

import requests

from app.config import BASE_DIR, SOURCE_DIR

logger = logging.getLogger("pipeline.scraper")

API_URL = "https://finance.vietstock.vn/data/eventstransferdata"
PAGE_URL = "https://finance.vietstock.vn/giao-dich-noi-bo"
PAGE_SIZE = 50
FULL_RANGE = ("01/01/2020", f"31/12/{datetime.now().year}")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
RAW_FILE = os.path.join(RAW_DIR, "vietstock-insider-raw.json")
LEGACY_RAW_FILE = os.path.join(SOURCE_DIR, "vietstock-insider-raw.json")


def _ensure_raw_dir():
    os.makedirs(RAW_DIR, exist_ok=True)


def _new_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": UA})
    return s


def _get_token(session: requests.Session) -> str:
    resp = session.get(PAGE_URL, timeout=15)
    resp.raise_for_status()
    m = re.findall(r"__RequestVerificationToken[^>]*\svalue=([^\s>]+)", resp.text)
    if not m:
        m = re.findall(r'__RequestVerificationToken[^"]*"[^"]*value="([^"]+)"', resp.text)
    if not m:
        m = re.findall(r'name="__RequestVerificationToken"\s+value="([^"]+)"', resp.text)
    if not m:
        raise ValueError("Could not find CSRF token")
    return m[0]


def _fetch_page(session, token, page, fdate, tdate, transfer_type=0, page_size=PAGE_SIZE):
    data = {
        "transferTypeID": str(transfer_type),
        "stockCode": "",
        "fDate": fdate,
        "tDate": tdate,
        "page": str(page),
        "pageSize": str(page_size),
        "orderBy": "EventID",
        "orderDir": "desc",
        "__RequestVerificationToken": token,
    }
    resp = session.post(
        API_URL,
        headers={
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": PAGE_URL,
            "__RequestVerificationToken": token,
        },
        data=data,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def _parse_dotnet_date(s):
    if not s or not isinstance(s, str):
        return None
    m = re.search(r"/Date\((\d+)\)/", s)
    if m:
        return datetime.utcfromtimestamp(int(m.group(1)) / 1000).strftime("%Y-%m-%d")
    return None


def _parse_record(r: dict) -> dict:
    person = r.get("DTTHCD") or r.get("DTTHLQ") or r.get("NVTH") or ""
    if person.startswith("Nhóm"):
        person = person.split(" - ")[0] if " - " in person else person
    pos = r.get("PositionCD") or r.get("ExtraPositionNLQ") or r.get("ExtraPositionNLQEx") or ""
    if pos == "Blank":
        pos = ""
    relationship = r.get("RelationShipType") or ""
    if relationship == "Blank":
        relationship = ""
    return {
        "ticker": r.get("StockCode", ""),
        "person": person,
        "position": pos,
        "relationship": relationship,
        "volBefore": r.get("VolumeBefore") or r.get("RegisterVolumeBefore") or 0,
        "volAfter": r.get("VolumeAfter") or r.get("RegisterVolumeAfter") or 0,
        "registerBuy": r.get("RegisterBuyVolume") or 0,
        "actualBuy": r.get("BuyVolume") or 0,
        "registerSell": r.get("RegisterSellVolume") or 0,
        "actualSell": r.get("SellVolume") or 0,
        "planBegin": _parse_dotnet_date(r.get("DateActionFrom")),
        "planEnd": _parse_dotnet_date(r.get("DateActionTo")),
        "buyExpected": _parse_dotnet_date(r.get("DateBuyExpected")),
        "sellExpected": _parse_dotnet_date(r.get("DateSellExpected")),
        "status": r.get("StatusName", ""),
        "typeName": r.get("TypeName", ""),
        "transferTypeID": r.get("TransferTypeID", 0),
        "source": "vietstock",
        "eventID": str(r.get("EventID", "")),
        "title": re.sub(r"<[^>]+>", "", r.get("Title", ""))[:200],
        "fileUrl": r.get("FileUrl", ""),
    }


def _record_key(rec: dict) -> str:
    ev = rec.get("eventID") or rec.get("EventID")
    if ev:
        return "evt:" + str(ev)
    return "cmp:" + "|".join(
        [str(rec.get("ticker", "")), str(rec.get("person", "")), str(rec.get("planBegin", "") or ""), str(rec.get("title", ""))]
    )


def _normalize(rec: dict) -> dict:
    """Coerce a raw record (either parsed or raw Vietstock shape) to the
    parsed representation so dedup keys are consistent across sources."""
    if "StockCode" in rec or "EventID" in rec:
        return _parse_record(rec)
    return rec


def load_raw(path: str | None = None) -> list[dict]:
    path = path or RAW_FILE
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_raw(records: list[dict], path: str | None = None):
    _ensure_raw_dir()
    path = path or RAW_FILE
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)


def scrape(full: bool = False, since: datetime | None = None, live: bool = True) -> list[dict]:
    """Return raw insider records.

    If ``live`` is False (or the network fetch fails), falls back to the
    existing raw JSON file so the pipeline can still run offline.
    """
    if not live:
        logger.info("Scraper in offline mode -> loading existing raw file")
        recs = load_raw()
        if not recs and os.path.exists(LEGACY_RAW_FILE):
            logger.info("Falling back to legacy raw file %s", LEGACY_RAW_FILE)
            recs = load_raw(LEGACY_RAW_FILE)
        return recs

    try:
        return _scrape_live(full=full, since=since)
    except Exception as e:
        logger.warning("Live scrape failed (%s); falling back to offline raw file", e)
        return load_raw()


def _scrape_live(full: bool = False, since: datetime | None = None) -> list[dict]:
    session = _new_session()
    existing = load_raw()
    seen = {_record_key(_normalize(r)) for r in existing}

    fdate, tdate = FULL_RANGE
    logger.info("Scraper LIVE mode: %s %s -> %s", "FULL" if full else "INCREMENTAL", fdate, tdate)

    # A full run always scans from page 1 so that statuses of OLD events
    # (e.g. a "Đăng ký" that later completed) get refreshed too.
    start_page = 1

    token = _get_token(session)
    page = start_page
    total = None
    added = 0
    consecutive_seen = 0
    errors = 0
    MAX_RETRIES = 6

    while True:
        try:
            data = _fetch_page(session, token, page, fdate, tdate)
        except Exception as e:
            errors += 1
            logger.error("Page %s fetch error: %s", page, e)
            if errors >= MAX_RETRIES:
                logger.error("Too many consecutive errors; stopping")
                break
            try:
                token = _get_token(session)
            except Exception:
                pass
            time.sleep(min(2**errors, 30))
            continue

        if not isinstance(data, list) or not data:
            # Empty body mid-stream (throttle/timeout artifact) -> retry same page.
            if total and page * PAGE_SIZE < total:
                errors += 1
                logger.warning("Page %s empty mid-stream; retrying (%s/6)", page, errors)
                if errors >= MAX_RETRIES:
                    break
                time.sleep(min(2**errors, 30))
                continue
            logger.info("Page %s: no more data", page)
            break

        errors = 0
        if total is None:
            total = data[0].get("TotalRecord", 0)
            logger.info("Total available: %s", total)

        page_new = 0
        for r in data:
            parsed = _parse_record(r)
            if not parsed.get("ticker"):
                continue
            key = _record_key(parsed)
            if key in seen:
                continue
            seen.add(key)
            existing.append(parsed)
            added += 1
            page_new += 1

        if page_new == 0:
            consecutive_seen += 1
            if consecutive_seen >= 2 and not full:
                logger.info("No new records for 2 consecutive pages; stopping (incremental)")
                break
        else:
            consecutive_seen = 0

        if page % 10 == 0 or page <= 3 or page == start_page:
            logger.info("Page %s: +%s new (total %s)", page, added, len(existing))
        if page % 50 == 0:
            save_raw(existing)

        # Genuine end is a short response only once we've reached the expected
        # total. A short response before that is a transient artifact -> retry.
        if len(data) < PAGE_SIZE:
            if total and page * PAGE_SIZE < total:
                logger.warning("Page %s short response (%s) mid-stream; retrying", page, len(data))
                time.sleep(2)
                continue
            break

        page += 1
        time.sleep(0.5)
        if page % 20 == 0:
            token = _get_token(session)
            time.sleep(1)

    save_raw(existing)
    logger.info("Scrape done: +%s new, raw total %s", added, len(existing))
    return existing
