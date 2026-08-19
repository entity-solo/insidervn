import datetime as dt

from pipeline import enricher, migrator, winrate


def test_map_role():
    assert migrator.map_role("Chủ tịch HĐQT") == ("Chủ tịch HĐQT", "chairman")
    assert migrator.map_role("Tổng Giám đốc") == ("Tổng Giám đốc", "ceo")
    assert migrator.map_role("Cổ đông lớn") == ("Cổ đông lớn", "major")
    assert migrator.map_role("") == ("Người liên quan", "related")


def test_map_transaction():
    buy = migrator.map_transaction({"status": "Kết quả", "registerBuy": 100, "actualBuy": 80})
    assert buy == ("buy", 100, 80)
    sell = migrator.map_transaction({"status": "Kết quả", "registerSell": 50, "actualSell": 40})
    assert sell == ("sell", 50, 40)
    none = migrator.map_transaction({"status": "Kết quả"})
    assert none is None


def test_price_helpers():
    hist = {"2024-01-01": 100, "2024-01-10": 110, "2024-02-01": 90}
    assert enricher._price_at(hist, "2024-01-05") == 100
    assert enricher._price_after(hist, "2024-01-01", 7) == 110
    # drawdown before 2024-02-01: peak 110 -> 90 => -18.18%
    dd = enricher._max_drawdown_before(hist, "2024-02-01", lookback=60)
    assert dd < 0


def test_migrate_sample():
    raw = [
        {
            "ticker": "FPT",
            "person": "Nguyen A",
            "position": "Tổng Giám đốc",
            "relationship": "",
            "volBefore": 0,
            "volAfter": 0,
            "registerBuy": 100,
            "actualBuy": 100,
            "registerSell": 0,
            "actualSell": 0,
            "planBegin": "2024-01-01",
            "planEnd": "2024-01-31",
            "status": "Kết quả",
            "typeName": "GD công ty",
            "eventID": "999",
            "title": "test",
            "fileUrl": "",
        }
    ]
    info = {"FPT": ("CTCP FPT", "HOSE")}
    rows = migrator.migrate(raw, ticker_info=info)
    assert len(rows) == 1
    r = rows[0]
    assert r["ticker"] == "FPT"
    assert r["company"] == "CTCP FPT"
    assert r["exchange"] == "HOSE"
    assert r["type"] == "buy"
    assert r["executed"] == 100
    assert r["role_key"] == "ceo"
    assert r["event_id"] == 999


def test_recompute_winrates():
    n = winrate.recompute_winrates()
    assert n > 0
