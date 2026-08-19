import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.transaction import Transaction
from ..schemas import PaginatedTransactions, TransactionOut
from ..cache import get_or_set

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

EXCHANGES = {"HOSE", "HNX", "UPCoM"}


def get_max_date(db: Session) -> str:
    m = db.query(func.max(Transaction.date_reg)).scalar()
    return m or datetime.now().strftime("%Y-%m-%d")


def period_cutoff(period: str, anchor: str) -> str:
    if re.fullmatch(r"\d{4}", period):
        return f"{period}-01-01"
    days = int(period)
    d = datetime.strptime(anchor, "%Y-%m-%d") - timedelta(days=days)
    return d.strftime("%Y-%m-%d")


SORT_COLS = {
    "date": Transaction.date_reg,
    "value": func.coalesce(Transaction.executed, Transaction.shares) * func.coalesce(Transaction.p_from, 0),
    "shares": func.coalesce(Transaction.executed, Transaction.shares),
    "perf1w": Transaction.perf_1w,
    "perf1m": Transaction.perf_1m,
    "ticker": Transaction.ticker,
}


@router.get("", response_model=PaginatedTransactions)
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(60, ge=1, le=100),
    type: str = "all",
    exchange: str = "all",
    role: str = "all",
    period: str = "all",
    q: str = "",
    person: str = "",
    ticker: str = "",
    sort: str = "date",
    dir: str = "desc",
    db: Session = Depends(get_db),
):
    q = q.strip()
    anchor = get_max_date(db)
    query = db.query(Transaction)

    if ticker:
        query = query.filter(Transaction.ticker == ticker.upper())

    if person:
        query = query.filter(func.lower(Transaction.person).like(f"%{person.lower()}%"))

    if type == "buy":
        query = query.filter(Transaction.type == "buy")
    elif type == "sell":
        query = query.filter(Transaction.type == "sell")
    elif type == "register":
        query = query.filter(Transaction.executed == None)  # noqa: E711
    elif type in EXCHANGES:
        query = query.filter(Transaction.exchange == type)

    if exchange in EXCHANGES:
        query = query.filter(Transaction.exchange == exchange)

    if role != "all":
        query = query.filter(Transaction.role_key == role)

    if period != "all":
        query = query.filter(Transaction.date_reg >= period_cutoff(period, anchor))

    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(Transaction.ticker).like(like),
                func.lower(Transaction.person).like(like),
                func.lower(Transaction.company).like(like),
                func.lower(Transaction.role).like(like),
            )
        )

    sort_col = SORT_COLS.get(sort, Transaction.date_reg)
    query = query.order_by(sort_col.asc() if dir == "asc" else sort_col.desc())

    cache_key = (
        f"tx|{page}|{page_size}|{type}|{exchange}|{role}|{period}|"
        f"{q}|{person}|{ticker}|{sort}|{dir}"
    )

    def _build():
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        total_pages = (total + page_size - 1) // page_size
        return PaginatedTransactions(
            items=[TransactionOut.model_validate(i) for i in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ).model_dump()

    return get_or_set(cache_key, _build, ttl=300)
