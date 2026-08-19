from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import DATABASE_URL


def _normalize_url(url: str) -> str:
    # Supabase hands out postgres:// which SQLAlchemy expects as postgresql://
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


URL = _normalize_url(DATABASE_URL)


def _engine_kwargs(url: str) -> dict:
    if url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    # Postgres / Supabase / Neon: resilient, pooled connections for concurrent
    # API replicas + the pipeline worker sharing the same database.
    return {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "connect_args": {"connect_timeout": 10},
    }


engine = create_engine(URL, future=True, **_engine_kwargs(URL))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import os

    if URL.startswith("sqlite:///"):
        db_path = URL.replace("sqlite:///", "")
        parent = os.path.dirname(db_path)
        if parent:
            os.makedirs(parent, exist_ok=True)
    # Import every model module so all tables register on Base regardless of
    # call order (the worker may call init_db() before any other import).
    from .models import transaction, winrate, price  # noqa: F401

    Base.metadata.create_all(bind=engine)
