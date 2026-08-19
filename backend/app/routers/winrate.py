from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.winrate import Winrate
from ..schemas import WinrateOut
from ..cache import get_or_set

router = APIRouter(prefix="/api/winrate", tags=["winrate"])


@router.get("", response_model=list[WinrateOut])
def list_winrate(
    filter: str = "all",
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    cache_key = f"wr|{filter}|{limit}"

    def _build():
        q = db.query(Winrate)
        if filter == "winner":
            q = q.filter(Winrate.wr >= 50)
        elif filter == "loser":
            q = q.filter(Winrate.wr < 50)
        elif filter == "volume":
            q = q.filter(func.abs(Winrate.total) >= 10_000_000_000)
        q = q.order_by(Winrate.wr.desc(), Winrate.total.desc())
        rows = q.limit(limit).all()
        return [
            WinrateOut(
                person=r.person,
                wr=r.wr,
                wins=r.wins,
                losses=r.losses,
                total_trades=r.total_trades,
                pnl=r.pnl,
                total=r.total,
                tickers=r.tickers.split(",") if r.tickers else [],
            ).model_dump()
            for r in rows
        ]

    return get_or_set(cache_key, _build, ttl=300)
