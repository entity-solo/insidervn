# InsiderVN Backend (Phase 1)

FastAPI REST API + SQLite cho dữ liệu giao dịch nội bộ chứng khoán Việt Nam.
Chuyển từ kiến trúc "embed 16.5MB JSON trong JS" sang **API + Database** — mỗi request
chỉ trả vài chục KB thay vì toàn bộ dataset.

## Stack
- **FastAPI** (ASGI) + **SQLAlchemy 2.0** (SQLite dev / dễ chuyển PostgreSQL)
- **Pydantic v2** schemas
- Middleware: CORS, GZip (built-in), in-memory Rate Limiter
- Auth: Supabase (phía frontend, backend chỉ phục vụ dữ liệu công khai)

## Cấu trúc
```
backend/
├── app/
│   ├── main.py            # FastAPI app, middleware, /health
│   ├── config.py          # cấu hình từ env
│   ├── database.py        # engine, session, init_db
│   ├── models/            # Transaction, Winrate, Price
│   ├── schemas.py         # Pydantic response models
│   ├── routers/           # transactions, signals, winrate, prices, search
│   └── services/          # business logic (cluster/dip/highlights)
├── scripts/seed.py        # parse app-data-full.js / app-prices.js / insider-winrates.json -> SQLite
├── tests/test_api.py      # pytest
├── data/                  # SQLite db (tạo sau khi seed)
└── requirements.txt
```

## API Endpoints
| Method | Path | Mô tả |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/transactions` | Phân trang (60/page), filter `type`(buy/sell/register), `exchange`, `role`, `period`(7/30/.../2024), `q` search, `sort`(date/value/shares/perf1w/perf1m/ticker)+`dir` |
| GET | `/api/signals/clusters?window=14&exchange=all` | Mua rổ (≥2 insider cùng mua 1 mã trong cửa sổ N ngày) |
| GET | `/api/signals/dip?exchange=all` | Mua khi giá đã giảm ≥5% trước giao dịch |
| GET | `/api/signals/highlights` | Top clusters + mua ròng lớn + top insider mua nhiều |
| GET | `/api/winrate?filter=winner\|loser\|volume` | Xếp hạng Win Rate |
| GET | `/api/prices/{ticker}` | Chuỗi giá tuần (chỉ 1 mã, ~2KB) |
| GET | `/api/search?q=FPT` | Tìm kiếm theo ticker/person/company |

## Chạy local
```bash
cd backend
python -m venv .venv && .venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt

# Seed từ dữ liệu cũ (SOURCE_DIR trỏ tới thư mục chứa app-data-full.js, app-prices.js, insider-winrates.json)
$env:SOURCE_DIR="<đường dẫn thư mục gốc InsiderVN>"
python scripts/seed.py

# Chạy server
uvicorn app.main:app --reload --port 8000
# Docs: http://localhost:8000/docs
```

## Test
```bash
pytest tests/ -q
```
> Tests dùng DB đã seed tại `data/insidervn.db`. Chạy `seed.py` trước khi test lần đầu.

## Env (`.env.example`)
```
DATABASE_URL=sqlite:///./data/insidervn.db
SOURCE_DIR=../   # thư mục chứa file dữ liệu export
CORS_ORIGINS=*
RATE_LIMIT_MAX=300
RATE_LIMIT_WINDOW=60
```

## Pipeline (Phase 2)

Thu thập & làm giàu dữ liệu, ghi thẳng vào DB (thay vì JSON file).

```
backend/pipeline/
├── scraper.py     # Vietstock fetch: retry/backoff + resume + offline fallback
├── migrator.py    # raw -> Transaction, upsert theo eventID (idempotent)
├── enricher.py    # giá (offline cache / live vnstock) + perf_1w/1m/dip + bảng prices
├── winrate.py     # recompute bảng winrates từ transactions
├── pipeline.py    # orchestrator: scrape -> migrate -> enrich -> winrate
└── scheduler.py   # APScheduler cron 01:00
```

Chạy:
```bash
# Offline (dùng cache có sẵn) — chạy được ngay không cần mạng
python scripts/run_pipeline.py

# Full re-scrape + enrich live
python scripts/run_pipeline.py --full --live

# Chạy liên tục (scheduler 01:00 mỗi ngày)
python scripts/run_pipeline.py --schedule
```
- **Offline fallback**: nếu không có mạng, scraper đọc `vietstock-insider-raw.json` có sẵn; enricher đọc `price-cache-full.json`. Pipeline vẫn chạy được end-to-end tại local.
- **Idempotent**: upsert theo `eventID` → chạy lại không tạo duplicate.
- **Winrate**: tính lại từ `perf_1m` của mỗi insider (thay vì file tĩnh) → số lượng insider đầy đủ hơn (3776 vs 52 cũ).

## Chuyển sang PostgreSQL (production)
Đổi `DATABASE_URL=postgresql+psycopg://user:pass@host/db` và cài `psycopg[binary]`.
Schema không đổi (SQLAlchemy dialect-agnostic).
