from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.transaction import Transaction
from ..schemas import SearchResult, TransactionOut

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResult)
def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    like = f"%{q.lower()}%"
    base = db.query(Transaction).filter(
        or_(
            func.lower(Transaction.ticker).like(like),
            func.lower(Transaction.person).like(like),
            func.lower(Transaction.company).like(like),
        )
    )
    total = base.count()
    tickers = [t for (t,) in db.query(func.distinct(Transaction.ticker)).filter(func.lower(Transaction.ticker).like(like)).limit(20).all()]
    persons = [p for (p,) in db.query(func.distinct(Transaction.person)).filter(func.lower(Transaction.person).like(like)).limit(20).all()]
    items = base.order_by(Transaction.date_reg.desc()).limit(limit).all()
    return SearchResult(
        total=total,
        tickers=tickers,
        persons=persons,
        items=[TransactionOut.model_validate(i) for i in items],
    )
