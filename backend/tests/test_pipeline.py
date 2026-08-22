import datetime as dt

from pipeline import enricher, migrator, winrate


def test_classify_role():
    role_key, role = migrator._classify_role("GD CĐ lớn", "Nguyễn A", "", "", "")
    assert role_key == "shareholder" and role == "Cổ đông lớn"
    role_key, role = migrator._classify_role("GD cổ phiếu quỹ", "CTCP ABC", "", "", "")
    assert role_key == "treasury" and role == "Cổ phiếu quỹ"
    role_key, _ = migrator._classify_role("GD CĐ nội bộ", "Nguyễn B", "", "", "")
    assert role_key == "internal"
    role_key, role = migrator._classify_role("GD của người liên quan", "CTCP Quỹ Đầu tư", "", "", "")
    assert role_key == "related" and role == "Tổ chức liên quan"
    role_key, _ = migrator._classify_role("", "Nguyễn C", "", "", "")
    assert role_key == "insider"


def test_sanitize_row():
    row = {"date_reg": "2032-05-10", "date_from": "2024-01-15", "date_to": "2024-02-01"}
    fixed = migrator._sanitize_row(row)
    assert fixed["date_reg"] == "2024-05-10"
    ok = {"date_reg": "2024-03-01", "date_from": "", "date_to": ""}
    assert migrator._sanitize_row(ok) == ok


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
            "type_raw": "buy",
            "volume": 1000,
            "executed": 800,
            "priceBefore": 50000,
            "registeredDate": "2024-01-01",
            "fromDate": "2024-01-01",
            "toDate": "2024-01-31",
            "status": "Kết quả",
            "typeName": "GD CĐ nội bộ",
            "eventID": "999",
        }
    ]
    info = {"FPT": {"company": "CTCP FPT", "exchange": "HOSE"}}
    rows = migrator.migrate(raw, ticker_info=info)
    assert len(rows) == 1
    r = rows[0]
    assert r["ticker"] == "FPT"
    assert r["company"] == "CTCP FPT"
    assert r["exchange"] == "HOSE"
    assert r["person_type"] == "person"
    assert r["type"] == "buy"
    assert r["shares"] == 1000
    assert r["executed"] == 800
    assert r["p_from"] == 50000.0
    assert r["role_key"] == "internal"
    assert r["role"] == "Cổ đông nội bộ"
    assert r["event_id"] == 999


def test_recompute_winrates():
    n = winrate.recompute_winrates()
    assert n > 0
