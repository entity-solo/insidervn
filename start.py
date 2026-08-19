import os
import sys
import shutil
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from apscheduler.schedulers.background import BackgroundScheduler

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR", APP_DIR)
PORT = int(os.environ.get("PORT", "8080"))


def seed():
    src = os.path.join(APP_DIR, "app-data-full.js")
    dst = os.path.join(DATA_DIR, "app-data-full.js")
    if not os.path.exists(dst) and os.path.exists(src):
        shutil.copy(src, dst)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=APP_DIR, **k)

    def translate_path(self, path):
        local = super().translate_path(path)
        rel = os.path.relpath(local, APP_DIR)
        cand = os.path.join(DATA_DIR, rel)
        return cand if os.path.exists(cand) else local


def run_pipeline():
    print("SCHEDULED RUN start", flush=True)
    try:
        subprocess.check_call(
            [sys.executable, os.path.join(APP_DIR, "scripts", "pipeline.py")]
        )
    except Exception as e:
        print("SCHEDULED RUN error:", e, flush=True)
    print("SCHEDULED RUN done", flush=True)


def main():
    seed()
    os.chdir(DATA_DIR)
    sched = BackgroundScheduler()
    sched.add_job(run_pipeline, "cron", hour=1, minute=0)
    sched.start()
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Serving on :{PORT} | APP_DIR={APP_DIR} | DATA_DIR={DATA_DIR}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
