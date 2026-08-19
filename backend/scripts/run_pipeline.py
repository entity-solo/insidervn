"""Entry point to run the pipeline once (and optionally start the scheduler)."""
from __future__ import annotations

import argparse
import logging
import sys

sys.path.insert(0, ".")

from pipeline.pipeline import run_pipeline
from pipeline.scheduler import start, shutdown

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--full", action="store_true", help="Full re-scrape 2020-2026 (else incremental)")
    ap.add_argument("--live", action="store_true", help="Fetch live from source (else offline cache)")
    ap.add_argument("--schedule", action="store_true", help="Start APScheduler and keep running")
    args = ap.parse_args()

    summary = run_pipeline(full=args.full, live=args.live)
    print("SUMMARY:", summary)

    if args.schedule:
        start()
        print("Scheduler running. Press Ctrl+C to stop.")
        try:
            import time

            while True:
                time.sleep(60)
        except KeyboardInterrupt:
            shutdown()
            print("Stopped.")


if __name__ == "__main__":
    main()
