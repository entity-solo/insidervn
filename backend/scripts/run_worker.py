"""Decoupled pipeline worker.

Runs the scrape -> migrate -> enrich -> winrate pipeline independently of the
API process, so the API can stay stateless and scale horizontally while this
worker owns all writes to the database.

Usage:
  python -m scripts.run_worker --schedule         # nightly incremental + keep alive
  python -m scripts.run_worker --full --schedule  # full seed once, then nightly
  python -m scripts.run_worker --once             # run pipeline once and exit
  python -m scripts.run_worker --full --once      # full seed once and exit

On first boot with an empty database, `--schedule` automatically runs a full
seed before starting the nightly schedule (so a fresh deploy self-populates
without manual intervention).
"""
from __future__ import annotations

import argparse
import logging
import sys
import time

sys.path.insert(0, ".")

from pipeline.pipeline import run_pipeline
from pipeline.scheduler import start, shutdown

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


def _db_is_empty() -> bool:
    try:
        from app.database import SessionLocal
        from app.models.transaction import Transaction

        with SessionLocal() as s:
            return s.query(Transaction).count() == 0
    except Exception:
        return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--full", action="store_true", help="Full re-scrape 2020-2026 (else incremental)")
    ap.add_argument("--live", action="store_true", help="Fetch live from source (else offline cache)")
    ap.add_argument("--schedule", action="store_true", help="Start scheduler and keep running")
    ap.add_argument("--once", action="store_true", help="Run pipeline once and exit")
    args = ap.parse_args()

    if args.once or not args.schedule:
        summary = run_pipeline(full=args.full, live=args.live)
        print("SUMMARY:", summary)
        if not args.schedule:
            return

    if args.schedule:
        if not args.full and _db_is_empty():
            print("DB empty -> running full seed before starting scheduler")
            run_pipeline(full=True, live=True)
        start()
        print("Worker running (nightly 01:00). Press Ctrl+C to stop.")
        try:
            while True:
                time.sleep(60)
        except KeyboardInterrupt:
            shutdown()
            print("Stopped.")


if __name__ == "__main__":
    main()
