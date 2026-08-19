import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Point at the seeded dev database so tests don't need to re-import 18MB source files.
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "insidervn.db")
os.environ.setdefault("DATABASE_URL", f"sqlite:///{DB_PATH}")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_transactions_pagination():
    r = client.get("/api/transactions?page=1&page_size=5")
    assert r.status_code == 200
    j = r.json()
    assert j["total"] > 0
    assert len(j["items"]) == 5
    assert j["total_pages"] == (j["total"] + 5 - 1) // 5


def test_transactions_type_filters():
    buy = client.get("/api/transactions?type=buy&page_size=1").json()["total"]
    sell = client.get("/api/transactions?type=sell&page_size=1").json()["total"]
    reg = client.get("/api/transactions?type=register&page_size=1").json()["total"]
    assert buy > 0 and sell > 0 and reg > 0
    # register = transactions with no executed amount yet (subset of buy/sell)
    assert reg <= buy + sell


def test_transactions_exchange_and_role():
    assert client.get("/api/transactions?exchange=HOSE&page_size=1").json()["total"] > 0
    assert client.get("/api/transactions?exchange=HNX&page_size=1").json()["total"] > 0
    assert client.get("/api/transactions?role=board&page_size=1").json()["total"] > 0


def test_transactions_search_and_period():
    assert client.get("/api/transactions?q=nguyen&page_size=1").json()["total"] >= 1
    assert client.get("/api/transactions?period=2024&page_size=1").json()["total"] > 0


def test_winrate():
    rows = client.get("/api/winrate").json()
    assert len(rows) > 0
    assert all("wr" in r for r in rows)


def test_signals():
    assert len(client.get("/api/signals/clusters?window=14").json()) > 0
    assert len(client.get("/api/signals/dip").json()) > 0
    h = client.get("/api/signals/highlights").json()
    assert "clusters" in h and "buys" in h and "buyers" in h


def test_prices_and_search():
    p = client.get("/api/prices/FPT")
    assert p.status_code == 200
    assert len(p.json()["dates"]) > 0
    assert client.get("/api/prices/ZZZNOTICKER").status_code == 404
    s = client.get("/api/search?q=FPT").json()
    assert s["total"] > 0
