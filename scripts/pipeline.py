import subprocess, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.environ.get("DATA_DIR", ROOT)


def run(script):
    print("RUN", script, flush=True)
    subprocess.check_call([sys.executable, os.path.join(ROOT, script)])


def run_optional(script):
    print("RUN (optional)", script, flush=True)
    try:
        subprocess.check_call([sys.executable, os.path.join(ROOT, script)])
        return True
    except Exception as e:
        print("WARN: step failed, continuing with existing data:", e, flush=True)
        return False


if __name__ == "__main__":
    os.chdir(DATA_DIR)
    run_optional("scrape-insiders.py")
    run_optional("migrate-vietstock.py")
    run("generate-app-data.py")
    run("build-prices.py")
    run("enrich-data.py")
    print("DONE", flush=True)
