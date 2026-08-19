"""Pipeline orchestrator: scrape -> migrate -> enrich -> recompute winrates."""
from __future__ import annotations

import logging

from app.database import init_db

from . import enricher, migrator, scraper, winrate

logger = logging.getLogger("pipeline")


def run_pipeline(full: bool = False, live: bool = False, enrich_offline: bool = True) -> dict:
    logger.info("=== Pipeline run start (full=%s, live=%s, enrich_offline=%s) ===", full, live, enrich_offline)

    init_db()

    raw = scraper.scrape(full=full, live=live)
    logger.info("Scraped %s raw records", len(raw))

    rows = migrator.migrate(raw)
    inserted, updated = migrator.upsert_transactions(rows)
    logger.info("Migrated: +%s new, ~%s updated", inserted, updated)

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
    logger.info("=== Pipeline run done: %s ===", summary)
    return summary
