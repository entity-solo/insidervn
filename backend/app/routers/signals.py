from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..cache import get_or_set
from ..database import get_db
from ..schemas import ClusterOut, HighlightsOut, TransactionOut
from ..services import signals as signal_svc

router = APIRouter(prefix="/api/signals", tags=["signals"])


@router.get("/clusters", response_model=list[ClusterOut])
def clusters(
    window: int = Query(14, ge=1, le=90),
    exchange: str = "all",
    side: str = Query("buy", pattern="^(buy|sell)$"),
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
):
    def _build():
        return [c.model_dump() for c in signal_svc.get_clusters(
            db, window_days=window, exchange=exchange, side=side, limit=limit)]

    return get_or_set(f"clusters|{window}|{exchange}|{side}|{limit}", _build, ttl=600)


@router.get("/cluster-members", response_model=list[TransactionOut])
def cluster_members(
    ticker: str,
    persons: str,
    start: str,
    side: str = Query("buy", pattern="^(buy|sell)$"),
    days: int = Query(14, ge=1, le=90),
    db: Session = Depends(get_db),
):
    plist = [p.strip() for p in persons.split(",") if p.strip()][:20]
    rows = signal_svc.get_cluster_members(db, ticker=ticker, persons=plist, start=start, days=days, side=side)
    return [TransactionOut.model_validate(r) for r in rows]


@router.get("/dip", response_model=list[TransactionOut])
def dip(
    exchange: str = "all",
    limit: int = Query(80, ge=1, le=200),
    db: Session = Depends(get_db),
):
    def _build():
        return [TransactionOut.model_validate(r).model_dump()
                for r in signal_svc.get_dip_buys(db, exchange=exchange, limit=limit)]

    return get_or_set(f"dip|{exchange}|{limit}", _build, ttl=300)


@router.get("/largest", response_model=list[TransactionOut])
def largest(
    side: str = Query("buy", pattern="^(buy|sell)$"),
    exchange: str = "all",
    limit: int = Query(80, ge=1, le=200),
    days: int = Query(0, ge=0, le=3650),
    db: Session = Depends(get_db),
):
    def _build():
        return [TransactionOut.model_validate(r).model_dump()
                for r in signal_svc.get_largest(db, side=side, exchange=exchange, limit=limit, days=days)]

    return get_or_set(f"largest|{side}|{exchange}|{limit}|{days}", _build, ttl=300)


@router.get("/treasury", response_model=list[TransactionOut])
def treasury(
    exchange: str = "all",
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
):
    def _build():
        return [TransactionOut.model_validate(r).model_dump()
                for r in signal_svc.get_treasury(db, exchange=exchange, limit=limit)]

    return get_or_set(f"treasury|{exchange}|{limit}", _build, ttl=300)


@router.get("/rally", response_model=list[TransactionOut])
def rally(
    exchange: str = "all",
    limit: int = Query(80, ge=1, le=200),
    db: Session = Depends(get_db),
):
    def _build():
        return [r.model_dump() for r in signal_svc.get_rally_sells(db, exchange=exchange, limit=limit)]

    return get_or_set(f"rally|{exchange}|{limit}", _build, ttl=300)


@router.get("/highlights", response_model=HighlightsOut)
def highlights(
    window: int = Query(14, ge=1, le=90),
    exchange: str = "all",
    db: Session = Depends(get_db),
):
    return signal_svc.get_highlights(db, exchange=exchange, window_days=window)
