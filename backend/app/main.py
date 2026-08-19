import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from .config import CORS_ORIGINS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW
from .database import init_db
from .routers import prices, search, signals, transactions, winrate


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = RATE_LIMIT_MAX, window: int = RATE_LIMIT_WINDOW):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window
        self.hits: defaultdict[str, list] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "anon"
        now = time.time()
        self.hits[ip] = [t for t in self.hits[ip] if now - t < self.window]
        if len(self.hits[ip]) >= self.max_requests:
            return JSONResponse({"detail": "Too many requests"}, status_code=429)
        self.hits[ip].append(now)
        return await call_next(request)


app = FastAPI(title="InsiderVN API", version="1.0.0", lifespan=lifespan)

app.add_middleware(RateLimitMiddleware)
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


@app.get("/health")
def health():
    return {"status": "ok"}
