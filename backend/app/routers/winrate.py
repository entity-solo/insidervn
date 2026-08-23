import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.winrate import Winrate
from ..schemas import WinrateOut
from ..cache import get_or_set

router = APIRouter(prefix="/api/winrate", tags=["winrate"])


def _parse_tickers(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        val = json.loads(raw)
        return val if isinstance(val, list) else [str(val)]
    except (ValueError, TypeError):
        return [t.strip() for t in raw.split(",") if t.strip()]


@router.get("", response_model=list[WinrateOut])
def list_winrate(
    filter: str = "all",
    person: str = "",
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    person = person.strip()
    cache_key = f"wr|{filter}|{person}|{limit}"

    def _build():
        q = db.query(Winrate)
        if person:
            q = q.filter(func.lower(Winrate.person) == person.lower())
        if filter == "winner":
            q = q.filter(Winrate.wr >= 50)
        elif filter == "loser":
            q = q.filter(Winrate.wr < 50)
        elif filter == "volume":
            q = q.filter(func.abs(Winrate.total) >= 10_000_000_000)

        # Ranking order per intent:
        # - winner/all: Bayesian-smoothed win rate so a lucky single trade
        #   cannot outrank a proven record (shrunk toward 50%).
        # - loser: worst performers first.
        # - volume: biggest money moved first.
        if filter == "loser":
            q = q.order_by(Winrate.wr.asc(), Winrate.total.asc())
        elif filter == "volume":
            q = q.order_by(func.abs(Winrate.total).desc(), Winrate.wr.desc())
        else:
            score = ((Winrate.wins + 5.0) / (Winrate.total_trades + 10.0)) * 100.0
            q = q.order_by(score.desc(), Winrate.wr.desc(), Winrate.total_trades.desc())

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
                tickers=_parse_tickers(r.tickers),
            ).model_dump()
            for r in rows
        ]

    return get_or_set(cache_key, _build, ttl=300)
