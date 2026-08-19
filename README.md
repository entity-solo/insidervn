# InsiderVN

Theo dõi **giao dịch nội bộ (insider trading)** của lãnh đạo, HĐQT, cổ đông lớn
trên HOSE, HNX, UPCoM — tổng hợp tín hiệu mua rổ, mua khi giảm, xếp hạng Win Rate.

Kiến trúc refactor (từ SPA 16.5MB monolith → production-ready):

```
InsiderVN/
├── backend/                 # FastAPI + SQLite (API + pipeline)
│   ├── app/                 # API: main, config, database, models, routers, services
│   ├── pipeline/            # scraper → migrator → enricher → winrate → scheduler
│   ├── scripts/             # seed.py, run_pipeline.py
│   ├── tests/               # test_api.py, test_pipeline.py (13 passed)
│   ├── data/insidervn.db    # SQLite (28,622 tx, 755 prices, 3,776 winrates)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # Next.js 14 + TypeScript (App Router)
│   ├── app/                 # Feed, Signals, Winrate, Stock, Watchlist
│   ├── components/, lib/, store/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # local/prod container orchestration
└── _archive/                # 74 legacy files moved during cleanup
```

## Tại sao refactor
- **Cũ:** tải 16.5MB JSON mỗi lần (app-data-full.js), 21 file script rải rác,
  tính toán lặp lại ở client, thiếu cache, thiếu cấu trúc.
- **Mới:** API server-side (phân trang, lọc, sort) + pipeline có thể test +
  scheduler tự động. Frontend First Load JS chỉ **87–199KB**.

## Chạy local (dev)
```bash
# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m scripts.seed            # nếu chưa có data/insidervn.db
python -m uvicorn app.main:app --port 8000

# Frontend (terminal riêng)
cd frontend
npm install
npm run dev                        # http://localhost:3000  → proxy /api → :8000
```

## Chạy bằng Docker
```bash
docker compose up --build
# frontend :3000, backend :8000
```

## Deploy
- **Backend (API):** Railway service dùng `backend/Dockerfile` (uvicorn :8000).
  Biến: `DATABASE_URL`, `SOURCE_DIR`. Volume `/app/data` để giữ DB.
  Chạy pipeline đêm: `python -m scripts.run_pipeline --schedule`.
- **Frontend:** Railway HOẶC Vercel dùng `frontend/Dockerfile`.
  Build arg `NEXT_PUBLIC_API_BASE` = URL backend (ví dụ `https://api.insidervn.com`).
  Browser luôn gọi same-origin `/api`, Next proxy sang backend.
- **Auth:** Supabase (giữ nguyên) — client `@supabase/supabase-js` đã tích hợp sẵn.

## API chính
| Endpoint | Mô tả |
|---|---|
| `GET /api/transactions` | phân trang/lọc/sort/tìm |
| `GET /api/signals/clusters` | mua cùng lúc (rổ) |
| `GET /api/signals/dip` | mua khi giá giảm |
| `GET /api/signals/highlights` | đáng chú ý |
| `GET /api/winrate` | xếp hạng Win Rate (`?filter=winner\|loser\|volume`) |
| `GET /api/prices/{ticker}` | lịch sử giá |
| `GET /api/search?q=` | tìm mã/người |
| `GET /health` | healthcheck |

## Test
```bash
cd backend && pytest -q     # 13 tests (API + pipeline)
cd frontend && npm run build
```
