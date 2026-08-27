"""In-memory API metrics collector (resets hourly to stay bounded)."""
from __future__ import annotations

import time
from collections import defaultdict

_start = time.time()
_total = 0
_errors = 0
_by_path: dict[str, list[float]] = defaultdict(list)  # path -> [latency_ms, ...]
_last_reset = time.time()
_WINDOW = 3600  # reset every hour


def _maybe_reset():
    global _last_reset, _total, _errors, _by_path
    now = time.time()
    if now - _last_reset > _WINDOW:
        _total = 0
        _errors = 0
        _by_path.clear()
        _last_reset = now


def record(path: str, status: int, elapsed_ms: float):
    _maybe_reset()
    global _total, _errors
    _total += 1
    if status >= 400:
        _errors += 1
    # Normalise: strip query params, collapse IDs → :id
    key = path.split("?")[0]
    parts = []
    for p in key.strip("/").split("/"):
        if p.isdigit():
            parts.append(":id")
        else:
            parts.append(p)
    norm = "/" + "/".join(parts) if parts else "/"
    _by_path[norm].append(elapsed_ms)


def snapshot() -> dict:
    _maybe_reset()
    endpoints = []
    for path, lats in sorted(_by_path.items(), key=lambda kv: -len(kv[1])):
        endpoints.append({
            "path": path,
            "count": len(lats),
            "avg_ms": round(sum(lats) / len(lats), 1) if lats else 0,
            "p95_ms": round(sorted(lats)[int(len(lats) * 0.95)] if lats else 0, 1),
        })
    return {
        "total_requests": _total,
        "error_count": _errors,
        "error_rate": round(_errors / _total * 100, 1) if _total else 0,
        "uptime_s": round(time.time() - _start),
        "endpoints": endpoints,
    }
