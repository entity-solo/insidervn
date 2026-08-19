import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.price import Price
from ..schemas import PriceOut

router = APIRouter(prefix="/api/prices", tags=["prices"])


@router.get("/{ticker}", response_model=PriceOut)
def get_price(ticker: str, db: Session = Depends(get_db)):
    p = db.query(Price).filter(Price.ticker == ticker.upper()).first()
    if not p:
        raise HTTPException(status_code=404, detail="Ticker not found")
    return PriceOut(
        ticker=p.ticker,
        dates=json.loads(p.dates),
        values=[(None if v is None else float(v)) for v in json.loads(p.values)],
    )
