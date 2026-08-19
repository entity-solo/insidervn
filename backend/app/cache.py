"""Optional Redis read-cache for hot API responses.

No-op (pass-through) when ``REDIS_URL`` is unset or ``redis`` is unavailable,
so the app runs unchanged on SQLite-only setups. Activate by setting
``REDIS_URL=redis://host:6379/0`` in production.
"""
from __future__ import annotations

import json
import logging

from .config import REDIS_URL

logger = logging.getLogger("app.cache")

_client = None
_enabled = bool(REDIS_URL)

if _enabled:
    try:
        import redis

        _client = redis.Redis.from_url(REDIS_URL, socket_timeout=2, decode_responses=True)
    except Exception as e:  # pragma: no cover - depends on environment
        logger.warning("Redis unavailable, caching disabled: %s", e)
        _client = None
        _enabled = False

DEFAULT_TTL = 300  # seconds


def get_or_set(key: str, loader, ttl: int = DEFAULT_TTL):
    """Return the cached JSON value for ``key`` or compute/store it via ``loader``."""
    if _enabled and _client is not None:
        try:
            cached = _client.get(key)
            if cached is not None:
                return json.loads(cached)
        except Exception as e:  # pragma: no cover
            logger.warning("Cache get failed: %s", e)

    result = loader()

    if _enabled and _client is not None:
        try:
            _client.set(key, json.dumps(result, default=str), ex=ttl)
        except Exception as e:  # pragma: no cover
            logger.warning("Cache set failed: %s", e)
    return result


def invalidate_prefix(prefix: str = "insidervn:"):
    """Drop all cached entries (call after a pipeline run to avoid stale reads)."""
    if _enabled and _client is not None:
        try:
            for k in _client.scan_iter(match=f"{prefix}*"):
                _client.delete(k)
        except Exception as e:  # pragma: no cover
            logger.warning("Cache invalidate failed: %s", e)
