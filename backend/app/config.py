import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DEFAULT_DB = os.path.join(BASE_DIR, "data", "insidervn.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_DB}")

# Directory that holds the existing exported data files (app-data-full.js, app-prices.js, insider-winrates.json)
SOURCE_DIR = os.environ.get("SOURCE_DIR", os.path.dirname(BASE_DIR))

CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]

# Simple in-memory rate limiter settings
RATE_LIMIT_MAX = int(os.environ.get("RATE_LIMIT_MAX", "300"))
RATE_LIMIT_WINDOW = int(os.environ.get("RATE_LIMIT_WINDOW", "60"))

# Optional Redis read-cache (hot API responses). Empty => caching disabled.
REDIS_URL = os.environ.get("REDIS_URL", "")
