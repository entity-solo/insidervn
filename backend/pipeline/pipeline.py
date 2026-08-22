"""Pipeline orchestrator: scrape -> migrate -> enrich -> recompute winrates."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.database import init_db

from . import enricher, migrator, scraper, winrate

logger = logging.getLogger("pipeline")


def _mark_crawl(ok: bool):
    """Record the last crawl time so the UI can show real freshness."""
    try:
        from sqlalchemy import text

        from app.database import SessionLocal

        db = SessionLocal()
        db.execute(text(
            "CREATE TABLE IF NOT EXISTS app_meta (key VARCHAR(64) PRIMARY KEY, value TEXT)"
        ))
        stamp = datetime.now(timezone.utc).isoformat()
        db.execute(text(
            "INSERT INTO app_meta (key, value) VALUES ('last_crawl_at', :v), ('last_crawl_ok', :ok) "
            "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
        ), {"v": stamp, "ok": "1" if ok else "0"})
        db.commit()
        db.close()
    except Exception as e:  # never fail the pipeline over bookkeeping
        logger.warning("Could not record last-crawl time: %s", e)


def run_pipeline(full: bool = False, live: bool = False, enrich_offline: bool = True) -> dict:
    logger.info("=== Pipeline run start (full=%s, live=%s, enrich_offline=%s) ===", full, live, enrich_offline)

    init_db()

    raw: list = []
    inserted, updated = 0, 0
    try:
        if live:
            raw = scraper.scrape(full=full, live=True)
            logger.info("Scraped %s raw records", len(raw))
            rows = migrator.migrate(raw)
        else:
            # Offline first-seed: use the complete legacy snapshot (instant) when
            # present; otherwise the raw scrape cache; else nothing.
            recs = migrator.load_migrated_records()
            raw = recs
            if recs and "roleKey" in recs[0]:
                logger.info("Using legacy snapshot for offline seed (%s records)", len(recs))
                rows = migrator.migrate_legacy(recs)
            elif recs:
                rows = migrator.migrate(recs)
            else:
                raw = scraper.scrape(full=full, live=False)
                logger.info("Scraped %s raw records", len(raw))
                rows = migrator.migrate(raw)
        logger.info("Prepared %s rows", len(rows))

        inserted, updated = migrator.upsert_transactions(rows)
        logger.info("Migrated: +%s new, ~%s updated", inserted, updated)
    except Exception as e:
        # A scrape/migrate failure must not abort enrichment + winrates for
        # the data already in the DB.
        logger.exception("Scrape/migrate failed (pipeline continues): %s", e)
        summary = {
            "raw": len(raw),
            "inserted": 0,
            "updated": 0,
            "error": str(e),
            "ok": False,
        }
        _mark_crawl(ok=False)
        logger.info("=== Pipeline run aborted early: %s ===", summary)
        return summary

    enrich_res: dict = {}
    try:
        # Prices come from the bundled cache by default (no external dependency).
        # Pass enrich_offline=False only if `vnstock` is installed for live prices.
        enrich_res = enricher.enrich(offline=enrich_offline)
        logger.info("Enriched: %s", enrich_res)
    except Exception as e:
        logger.error("Enrichment failed (pipeline continues): %s", e)
        enrich_res = {"error": str(e)}

    n_wr = 0
    try:
        n_wr = winrate.recompute_winrates()
        logger.info("Winrates recomputed: %s insiders", n_wr)
    except Exception as e:
        logger.error("Winrate recompute failed (pipeline continues): %s", e)

    summary = {
        "raw": len(raw),
        "inserted": inserted,
        "updated": updated,
        "enriched": enrich_res,
        "winrates": n_wr,
        "ok": True,
    }
    _mark_crawl(ok=bool(enrich_res.get("error")) is False)
    logger.info("=== Pipeline run done: %s ===", summary)
    return summary
