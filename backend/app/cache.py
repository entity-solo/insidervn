"""Hot API response cache.

Two backends, chosen automatically:
- Redis when ``REDIS_URL`` is set (shared across replicas, survives restarts)
- In-process TTL dict otherwise (single-container deployments on Railway)

Both are pass-through safe: on any cache failure the loader simply runs.
"""
from __future__ import annotations

import json
import logging
import threading
import time

from .config import REDIS_URL

logger = logging.getLogger("app.cache")

_client = None
_enabled = bool(REDIS_URL)

if _enabled:
    try:
        import redis

        _client = redis.Redis.from_url(REDIS_URL, socket_timeout=2, decode_responses=True)
    except Exception as e:  # pragma: no cover - depends on environment
        logger.warning("Redis unavailable, falling back to in-process cache: %s", e)
        _client = None
        _enabled = False

DEFAULT_TTL = 300  # seconds

# ---- in-process fallback ----
_mem: dict[str, tuple[float, object]] = {}
_mem_lock = threading.Lock()
_MEM_MAX = 500


def _mem_get(key: str):
    with _mem_lock:
        item = _mem.get(key)
        if not item:
            return None
        expires, value = item
        if expires < time.time():
            _mem.pop(key, None)
            return None
        return value


def _mem_set(key: str, value, ttl: int):
    with _mem_lock:
        if len(_mem) >= _MEM_MAX:
            # Drop the oldest quarter instead of growing without bound.
            for k in sorted(_mem, key=lambda k: _mem[k][0])[: _MEM_MAX // 4]:
                _mem.pop(k, None)
        _mem[key] = (time.time() + ttl, value)


def get_or_set(key: str, loader, ttl: int = DEFAULT_TTL):
    """Return the cached value for ``key`` or compute/store it via ``loader``."""
    namespaced = f"insidervn:{key}"
    if _enabled and _client is not None:
        try:
            cached = _client.get(namespaced)
            if cached is not None:
                return json.loads(cached)
        except Exception as e:  # pragma: no cover
            logger.warning("Cache get failed: %s", e)
    else:
        hit = _mem_get(namespaced)
        if hit is not None:
            return hit

    result = loader()

    if _enabled and _client is not None:
        try:
            _client.set(namespaced, json.dumps(result, default=str), ex=ttl)
        except Exception as e:  # pragma: no cover
            logger.warning("Cache set failed: %s", e)
    else:
        _mem_set(namespaced, result, ttl)
    return result


def invalidate_all(prefix: str = "insidervn:"):
    """Drop cached entries (call after a pipeline run to avoid stale reads)."""
    if _enabled and _client is not None:
        try:
            for k in _client.scan_iter(match=f"{prefix}*"):
                _client.delete(k)
        except Exception as e:  # pragma: no cover
            logger.warning("Cache invalidate failed: %s", e)
    else:
        with _mem_lock:
            _mem.clear()
