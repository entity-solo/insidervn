# InsiderVN Frontend (Phase 3)

Next.js 14 (App Router) + TypeScript + Tailwind-free (global CSS) frontend cho InsiderVN.
Thay thế SPA vanilla JS cũ — tải ~16.5MB JSON → giờ chỉ gọi **API** (backend FastAPI),
First Load JS **87–199KB**.

## Stack
- **Next.js 14** App Router, **React 18**, **TypeScript** (strict)
- **@tanstack/react-query** — caching + infinite scroll (Feed), server-state
- **Recharts** — biểu đồ giá (`PriceChart`)
- **Zustand** (persist) — watchlist cá nhân (localStorage)
- **@supabase/supabase-js** — client sẵn sàng (auth tích hợp phase sau)

## Cấu trúc
```
frontend/
├── app/
│   ├── layout.tsx, providers.tsx, globals.css
│   ├── page.tsx            # Bảng tin (Feed: filter, sort, search, infinite scroll)
│   ├── signals/page.tsx    # Mua rổ / Mua khi giảm / Đáng chú ý
│   ├── winrate/page.tsx    # Xếp hạng Win Rate
│   ├── stock/page.tsx      # Tra mã / người + biểu đồ giá
│   └── watchlist/page.tsx  # Theo dõi (Zustand + recent trades)
├── components/             # Navbar, TransactionRow, TransactionModal, ClusterCard, PriceChart, WinrateRow
├── lib/                    # api.ts (fetch wrapper), types.ts, format.ts, supabase.ts
└── store/                  # watchlist.ts (Zustand)
```

## Chạy local
```bash
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE mặc định http://localhost:8000
npm install
npm run dev        # http://localhost:3000  (cần backend chạy ở :8000)
# hoặc production:
npm run build && npm run start
```
API gọi qua **rewrite** (`next.config.mjs`): `/api/*` → `NEXT_PUBLIC_API_BASE/api/*`,
nên frontend không cần CORS phức tạp khi cùng origin qua proxy.

## Build
```bash
npm run build   # type-check + tối ưu; First Load JS ~87-199KB
```
