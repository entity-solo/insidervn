from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("")
def meta(db: Session = Depends(get_db)):
    """Pipeline bookkeeping: when the source was last crawled and whether it succeeded."""
    out = {"last_crawl_at": None, "last_crawl_ok": None}
    try:
        row = db.execute(
            text("SELECT key, value FROM app_meta WHERE key IN ('last_crawl_at','last_crawl_ok')")
        ).all()
        for k, v in row:
            out[k] = v
    except Exception:
        pass
    return out
