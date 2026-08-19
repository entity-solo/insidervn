# InsiderVN — Deploy Guide (Vercel + Supabase + Railway)

Env values are already filled in `backend/.env` and `frontend/.env.local`
(gitignored). This guide covers the console steps you must click through.

## 0. Prereqs
- Repo pushed to GitHub.
- Logged into Vercel, Supabase, Railway.
- Reference data present at repo root: `vietstock-migrated.json`,
  `price-cache-full.json` (baked into the backend image automatically).

## 1. Supabase (done — values already in .env)
Project: `ardkbyxjwjvxksfzpytg`
- `DATABASE_URL` = Postgres POOLER URI (port 6543), password percent-encoded.
- `NEXT_PUBLIC_SUPABASE_URL` = `https://ardkbyxjwjvxksfzpytg.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = already set.
Schema is created automatically on first boot (`init_db()` in `app.main` lifespan
+ worker). No manual SQL needed.

## 2. Railway (api + worker, from the SAME repo/Dockerfile)
Railway does not run `docker-compose.yml` directly — deploy two services.

### Service A — `api`
- New service → Deploy from GitHub repo.
- Settings → Dockerfile Path: `backend/Dockerfile` (build context = repo root,
  so the reference JSONs are copied in).
- Start Command: leave default (Dockerfile CMD runs uvicorn on `$PORT`).
- Variables:
  - `DATABASE_URL` = (Supabase pooler URI from `backend/.env`)
  - `REDIS_URL` = empty (cache auto-disabled) — optional later
  - `SOURCE_DIR` = `/app/reference`
  - `CORS_ORIGINS` = `https://<vercel-domain>`  ← fill after Step 3
- Deploy. Copy the generated domain, e.g. `https://insidervn-api.railway.app`
  → that is `NEXT_PUBLIC_API_BASE`.

### Service B — `worker`
- New service → same repo → Dockerfile Path: `backend/Dockerfile`.
- **Start Command (override):** `python -m scripts.run_worker --schedule`
- Variables: same as api (`DATABASE_URL`, `SOURCE_DIR=/app/reference`,
  optional `REDIS_URL`).
- Deploy. First run auto-seeds (DB empty): full live scrape + migrate +
  enrich + winrate (~30–40 min). Watch logs; subsequent runs are nightly
  incremental (~seconds–1 min at 01:00).

## 3. Vercel (frontend)
- New project → import repo → set **Root Directory = `frontend`**,
  Framework = Next.js.
- Build & Env variables (set BEFORE first deploy — `NEXT_PUBLIC_*` are
  inlined at build time):
  - `NEXT_PUBLIC_API_BASE` = `https://<railway-api-domain>` (from Step 2)
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://ardkbyxjwjvxksfzpytg.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from `frontend/.env.local`)
- Deploy → copy the Vercel domain, e.g. `https://insidervn.vercel.app`.

## 4. Wire the two domains (post-deploy, 1-min)
1. In Railway **api** service: set `CORS_ORIGINS=https://<vercel-domain>` →
   Redeploy/restart api (and worker).
2. In Vercel: set `NEXT_PUBLIC_API_BASE=https://<railway-api-domain>` →
   Redeploy.
   (If you already used the generated domains above, this is already done.)

## 5. Verify
- Railway worker logs show `Pipeline run done ... ok: True`.
- Vercel site loads, `/api/transactions` returns data, login button hits
  Supabase.
- `backend/.env` + `frontend/.env.local` are NOT committed (gitignored).

## Notes
- `DATABASE_URL` uses the pooler (6543). If you see pool exhaustion under
  load, switch api to the session pooler (5432) or add `REDIS_URL`.
- To re-bake fresh reference data later, re-run locally
  `python -m scripts.run_worker --full --once` and commit the two JSONs.
