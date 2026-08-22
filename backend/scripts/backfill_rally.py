import bisect
import json
import time
from datetime import datetime, timedelta

from sqlalchemy import text

from app.database import SessionLocal
from app.models.price import Price
from app.models.transaction import Transaction


def _price_before_sorted(sd, h, date_str):
    i = bisect.bisect_right(sd, date_str) - 1
    return h[sd[i]] if i >= 0 else None


def main():
    session = SessionLocal()
    session.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS rally double precision;"))
    session.commit()
    print("column ensured")

    series = {}
    for p in session.query(Price).all():
        try:
            ds = json.loads(p.dates)
            vs = json.loads(p.values)
        except Exception:
            continue
        sd = [d for d, v in zip(ds, vs) if v is not None]
        h = {d: v for d, v in zip(ds, vs) if v is not None}
        sd.sort()
        if h:
            series[p.ticker] = (sd, h)
    print("price series:", len(series))

    sells = session.execute(
        text("SELECT id, ticker, date_from, date_reg FROM transactions WHERE type='sell'")
    ).fetchall()
    updates = []
    for id_, ticker, date_from, date_reg in sells:
        s = series.get(ticker)
        if not s:
            continue
        sd, h = s
        tdate = date_from or date_reg
        if not tdate:
            continue
        try:
            base = datetime.strptime(tdate, "%Y-%m-%d")
        except Exception:
            continue
        p1 = _price_before_sorted(sd, h, tdate)
        tgt = (base - timedelta(days=28)).strftime("%Y-%m-%d")
        p0 = _price_before_sorted(sd, h, tgt)
        if not p0 or not p1 or p0 <= 0:
            continue
        chg = round((p1 - p0) / p0 * 100, 2)
        updates.append((id_, chg))
    print("computed:", len(updates))

    chunk = 500
    for i in range(0, len(updates), chunk):
        part = updates[i : i + chunk]
        vals = []
        params = {}
        for j, (uid, val) in enumerate(part):
            vals.append(f"(:id{j}, :rally{j})")
            params[f"id{j}"] = uid
            params[f"rally{j}"] = val
        session.execute(
            text(
                "UPDATE transactions AS t SET rally=v.rally "
                "FROM (VALUES " + ", ".join(vals) + ") AS v(id, rally) WHERE t.id=v.id"
            ),
            params,
        )
        session.commit()
    print(f"Backfilled rally for {len(updates)} sells")


if __name__ == "__main__":
    t = time.time()
    main()
    print("done in", round(time.time() - t, 1), "s")
