import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Self-contained test database: no reliance on a pre-seeded dev DB so the
# suite runs on any clean machine/CI.
_TMPDIR = tempfile.mkdtemp(prefix="insidervn-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_TMPDIR, 'test.db')}"

from fastapi.testclient import TestClient  # noqa: E402

from app.database import SessionLocal, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.price import Price  # noqa: E402
from app.models.transaction import Transaction  # noqa: E402
from app.models.winrate import Winrate  # noqa: E402

init_db()


def _seed():
    db = SessionLocal()
    if db.query(Transaction).count() > 0:
        db.close()
        return
    txs = [
        # FPT: cluster mua rổ (2 người trong 14 ngày) + có giá
        dict(ticker="FPT", company="CTCP FPT", exchange="HOSE", person="Nguyen Van A",
             role="CEO", role_key="board", person_type="person", type="buy",
             shares=10000, executed=10000, p_from=50000.0,
             date_reg="2024-03-01", date_from="2024-03-01", source="vietstock",
             event_id=1, status="Kết quả", type_name="GD CĐ nội bộ"),
        dict(ticker="FPT", company="CTCP FPT", exchange="HOSE", person="Nguyen Thi B",
             role="CFO", role_key="board", person_type="person", type="buy",
             shares=5000, executed=5000, p_from=51000.0,
             date_reg="2024-03-05", date_from="2024-03-05", source="vietstock",
             event_id=2, status="Kết quả", type_name="GD CĐ nội bộ"),
        # đăng ký chưa khớp
        dict(ticker="FPT", company="CTCP FPT", exchange="HOSE", person="Nguyen Van C",
             role="CT", role_key="internal", person_type="person", type="buy",
             shares=2000, executed=None, p_from=None,
             date_reg="2024-04-01", date_from="2024-04-10", source="vietstock",
             event_id=3, status="Đăng ký", type_name="GD CĐ nội bộ"),
        # bán + HNX
        dict(ticker="SHB", company="Ngân hàng SHB", exchange="HNX", person="Tran Van D",
             role="CDL", role_key="shareholder", person_type="person", type="sell",
             shares=100000, executed=80000, p_from=12000.0,
             date_reg="2024-05-01", date_from="2024-05-01", source="vietstock",
             event_id=4, status="Kết quả", type_name="GD CĐ lớn"),
        # tín hiệu mua khi giảm
        dict(ticker="FPT", company="CTCP FPT", exchange="HOSE", person="Le Van E",
             role="HC", role_key="internal", person_type="person", type="buy",
             shares=3000, executed=3000, p_from=48000.0,
             date_reg="2024-06-01", date_from="2024-06-01", source="vietstock",
             event_id=5, status="Kết quả", type_name="GD CĐ nội bộ", dip=-7.5),
    ]
    db.add_all([Transaction(**t) for t in txs])
    db.add(Price(
        ticker="FPT",
        dates=json.dumps(["2024-01-05", "2024-02-02", "2024-03-01", "2024-04-05"]),
        values=json.dumps([48000, 49500, 50000, 52000]),
    ))
    db.add(Winrate(person="Nguyen Van A", wr=75.0, wins=3, losses=1,
                   total_trades=4, pnl=5.2, total=150000000.0, tickers='["FPT"]'))
    db.commit()
    db.close()


_seed()
client = TestClient(app)


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_transactions_pagination():
    r = client.get("/api/transactions?page=1&page_size=5")
    assert r.status_code == 200
    j = r.json()
    assert j["total"] >= 5
    assert len(j["items"]) == 5


def test_transactions_type_filters():
    buy = client.get("/api/transactions?type=buy&page_size=1").json()["total"]
    sell = client.get("/api/transactions?type=sell&page_size=1").json()["total"]
    reg = client.get("/api/transactions?type=register&page_size=1").json()["total"]
    assert buy > 0 and sell > 0 and reg > 0
    assert reg <= buy + sell


def test_transactions_exchange_and_role():
    assert client.get("/api/transactions?exchange=HOSE&page_size=1").json()["total"] > 0
    assert client.get("/api/transactions?exchange=HNX&page_size=1").json()["total"] > 0
    assert client.get("/api/transactions?role=board&page_size=1").json()["total"] > 0


def test_transactions_search_and_period():
    assert client.get("/api/transactions?q=nguyen&page_size=1").json()["total"] >= 1
    assert client.get("/api/transactions?period=2024&page_size=1").json()["total"] > 0


def test_transactions_invalid_period():
    assert client.get("/api/transactions?period=abc").status_code == 400


def test_winrate_tickers_are_list():
    rows = client.get("/api/winrate").json()
    assert len(rows) > 0
    assert all(isinstance(r["tickers"], list) for r in rows)


def test_winrate_person_filter():
    rows = client.get("/api/winrate", params={"person": "Nguyen Van A"}).json()
    assert len(rows) == 1
    assert rows[0]["wr"] == 75.0


def test_signals():
    clusters = client.get("/api/signals/clusters?window=14&side=buy").json()
    assert len(clusters) > 0
    assert any(c["ticker"] == "FPT" and c["count"] >= 2 for c in clusters)
    dips = client.get("/api/signals/dip").json()
    assert any(d["ticker"] == "FPT" for d in dips)
    h = client.get("/api/signals/highlights").json()
    assert "clusters" in h and "buys" in h and "buyers" in h


def test_prices_and_search():
    p = client.get("/api/prices/FPT")
    assert p.status_code == 200
    assert len(p.json()["dates"]) > 0
    assert client.get("/api/prices/ZZZNOTICKER").status_code == 404
    s = client.get("/api/search?q=FPT").json()
    assert s["total"] > 0
