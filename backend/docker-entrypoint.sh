#!/bin/sh
# Railway entrypoint.
#
# Reference data (vietstock-migrated.json, price-cache-full.json) is downloaded
# at runtime from REFERENCE_BASE_URL (a public GitHub raw base, set in env) so
# the build context stays tiny and `railway up` uploads succeed. If the files
# already exist (e.g. mounted or baked), the download is skipped.
if [ -n "$REFERENCE_BASE_URL" ]; then
  echo "[entrypoint] downloading reference data from $REFERENCE_BASE_URL"
  python - <<'PY'
import os, urllib.request, gzip, shutil
base = os.environ.get("REFERENCE_BASE_URL", "").rstrip("/")
for f in ["vietstock-migrated.json", "price-cache-full.json"]:
    out = "/app/reference/" + f
    if os.path.exists(out):
        continue
    gz = out + ".gz"
    url = f"{base}/{f}.gz"
    print("[entrypoint] GET", url)
    urllib.request.urlretrieve(url, gz)
    with gzip.open(gz, "rb") as i, open(out, "wb") as o:
        shutil.copyfileobj(i, o)
    print("[entrypoint] wrote", out)
PY
fi

# Worker-only mode: run the pipeline scheduler as the main process.
if [ "$APP_MODE" = "worker" ]; then
  echo "[entrypoint] APP_MODE=worker -> pipeline scheduler"
  exec python -m scripts.run_worker --schedule
fi

echo "[entrypoint] starting API on port ${PORT:-8000}"
uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" &

if [ "${RUN_WORKER:-true}" = "true" ]; then
  echo "[entrypoint] starting embedded pipeline worker (schedule)"
  exec python -m scripts.run_worker --schedule
fi

wait
