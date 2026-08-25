from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

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
    return signal_svc.get_clusters(db, window_days=window, exchange=exchange, side=side, limit=limit)


@router.get("/dip", response_model=list[TransactionOut])
def dip(
    exchange: str = "all",
    limit: int = Query(80, ge=1, le=200),
    db: Session = Depends(get_db),
):
    rows = signal_svc.get_dip_buys(db, exchange=exchange, limit=limit)
    return [TransactionOut.model_validate(r) for r in rows]


@router.get("/largest", response_model=list[TransactionOut])
def largest(
    side: str = Query("buy", pattern="^(buy|sell)$"),
    exchange: str = "all",
    limit: int = Query(80, ge=1, le=200),
    days: int = Query(0, ge=0, le=3650),
    db: Session = Depends(get_db),
):
    rows = signal_svc.get_largest(db, side=side, exchange=exchange, limit=limit, days=days)
    return [TransactionOut.model_validate(r) for r in rows]


@router.get("/treasury", response_model=list[TransactionOut])
def treasury(
    exchange: str = "all",
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
):
    rows = signal_svc.get_treasury(db, exchange=exchange, limit=limit)
    return [TransactionOut.model_validate(r) for r in rows]


@router.get("/rally", response_model=list[TransactionOut])
def rally(
    exchange: str = "all",
    limit: int = Query(80, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return signal_svc.get_rally_sells(db, exchange=exchange, limit=limit)


@router.get("/highlights", response_model=HighlightsOut)
def highlights(
    window: int = Query(14, ge=1, le=90),
    exchange: str = "all",
    db: Session = Depends(get_db),
):
    return signal_svc.get_highlights(db, exchange=exchange, window_days=window)
