import os, sys, time
from sqlalchemy import create_engine, text

with open("backend/.env") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k] = v.strip().strip('"').strip("'")

e = create_engine(os.environ["DATABASE_URL"])
THRESH_TX = 27000

for i in range(26):  # up to ~39 min
    with e.connect() as c:
        n = c.execute(text("select count(*) from transactions")).scalar()
        w = c.execute(text("select count(*) from winrates")).scalar()
    print(f"t={i*1.5:.1f}min transactions={n} winrates={w}", flush=True)
    if n >= THRESH_TX and w > 0:
        print("SEED_DONE", flush=True)
        sys.exit(0)
    time.sleep(90)

print("SEED_NOT_DONE_YET", flush=True)
sys.exit(1)
