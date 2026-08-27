import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from .config import CORS_ORIGINS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW
from .database import init_db
from . import metrics
from .routers import admin, meta, prices, search, signals, transactions, winrate


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


class ApiCacheHeaderMiddleware(BaseHTTPMiddleware):
    """Let browsers reuse GET /api responses briefly (data refreshes on a
    4-hour crawl cadence, so a minute of client caching is invisible)."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.method == "GET" and request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = RATE_LIMIT_MAX, window: int = RATE_LIMIT_WINDOW):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window
        self.hits: defaultdict[str, list] = defaultdict(list)
        self._req_count = 0

    def _prune(self, now: float):
        # Drop stale IP buckets so the dict cannot grow without bound.
        if len(self.hits) < 10_000:
            return
        stale = [ip for ip, ts in self.hits.items() if not ts or now - ts[-1] >= self.window]
        for ip in stale:
            self.hits.pop(ip, None)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in ("/health", "/"):
            return await call_next(request)
        ip = request.client.host if request.client else "anon"
        now = time.time()
        self._req_count += 1
        if self._req_count % 1000 == 0:
            self._prune(now)
        self.hits[ip] = [t for t in self.hits[ip] if now - t < self.window]
        if len(self.hits[ip]) >= self.max_requests:
            return JSONResponse({"detail": "Too many requests"}, status_code=429)
        self.hits[ip].append(now)
        return await call_next(request)


class ApiMetricsMiddleware(BaseHTTPMiddleware):
    """Record latency and status for every /api/ request (skip health/root)."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not path.startswith("/api/") or path.startswith("/api/admin"):
            return await call_next(request)
        t0 = time.time()
        response = await call_next(request)
        elapsed = (time.time() - t0) * 1000
        metrics.record(path, response.status_code, elapsed)
        return response


app = FastAPI(title="InsiderVN API", version="1.0.0", lifespan=lifespan)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(ApiMetricsMiddleware)
app.add_middleware(ApiCacheHeaderMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(signals.router)
app.include_router(winrate.router)
app.include_router(prices.router)
app.include_router(search.router)
app.include_router(meta.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}
