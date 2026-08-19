import json
import  os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import DATABASE_URL, SOURCE_DIR
from app.database import Base
from app.models.price import Price
from app.models.transaction import Transaction
from app.models.winrate import Winrate


def load_js_array(path: str, var: str):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    prefix = f"const {var}="
    assert content.startswith(prefix), f"{path} does not start with const {var}="
    body = content[len(prefix):].rstrip()
    if body.endswith(";"):
        body = body[:-1]
    return json.loads(body)


def _int(v):
    if v is None:
        return None
    try:
        return int(v)
    except (ValueError, TypeError):
        return None


def main():
    if DATABASE_URL.startswith("sqlite:///"):
        db_path = DATABASE_URL.replace("sqlite:///", "")
        parent = os.path.dirname(db_path)
        if parent:
            os.makedirs(parent, exist_ok=True)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # --- Transactions ---
    data = load_js_array(os.path.join(SOURCE_DIR, "app-data-full.js"), "DATA")
    txs = []
    for r in data:
        txs.append(
            Transaction(
                id=_int(r.get("id")),
                ticker=r.get("ticker"),
                company=r.get("company"),
                exchange=r.get("exchange"),
                person=r.get("person"),
                role=r.get("role"),
                role_key=r.get("roleKey"),
                type=r.get("type"),
                shares=_int(r.get("shares")),
                executed=_int(r.get("executed")),
                p_from=r.get("p_from"),
                p_to=r.get("p_to"),
                date_reg=r.get("date_reg"),
                date_from=r.get("date_from"),
                date_to=r.get("date_to"),
                source=r.get("source"),
                event_id=_int(r.get("eventID")),
                status=r.get("status"),
                type_name=r.get("typeName"),
                relationship=r.get("relationship"),
                vol_before=_int(r.get("volBefore")),
                vol_after=_int(r.get("volAfter")),
                perf_1w=r.get("perf_1w"),
                perf_1m=r.get("perf_1m"),
                dip=r.get("dip"),
            )
        )
    db.bulk_save_objects(txs)
    db.commit()
    print(f"Transactions: {len(txs)}")

    # --- Winrates ---
    wr_path = os.path.join(SOURCE_DIR, "insider-winrates.json")
    if os.path.exists(wr_path):
        with open(wr_path, encoding="utf-8") as f:
            wr = json.load(f)
        objs = []
        for r in wr:
            objs.append(
                Winrate(
                    person=r.get("person"),
                    wr=r.get("win_rate"),
                    wins=r.get("wins"),
                    losses=r.get("losses"),
                    total_trades=r.get("total_trades"),
                    pnl=r.get("avg_pnl_pct"),
                    total=r.get("total_pnl_vnd"),
                    tickers=json.dumps(r.get("tickers") or [], ensure_ascii=False),
                )
            )
        db.bulk_save_objects(objs)
        db.commit()
        print(f"Winrates: {len(objs)}")

    # --- Prices ---
    prices = load_js_array(os.path.join(SOURCE_DIR, "app-prices.js"), "PRICES")
    dates = prices.get("dates", [])
    series = prices.get("series", {})
    pobjs = []
    for ticker, vals in series.items():
        pobjs.append(
            Price(
                ticker=ticker,
                dates=json.dumps(dates, ensure_ascii=False),
                values=json.dumps(vals, ensure_ascii=False),
            )
        )
    db.bulk_save_objects(pobjs)
    db.commit()
    print(f"Prices: {len(pobjs)} tickers")

    db.close()
    print("SEED DONE")


if __name__ == "__main__":
    main()
