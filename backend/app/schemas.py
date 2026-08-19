from typing import List, Optional

from pydantic import BaseModel


class TransactionOut(BaseModel):
    id: int
    ticker: Optional[str] = None
    company: Optional[str] = None
    exchange: Optional[str] = None
    person: Optional[str] = None
    role: Optional[str] = None
    role_key: Optional[str] = None
    type: Optional[str] = None
    shares: Optional[int] = None
    executed: Optional[int] = None
    p_from: Optional[float] = None
    p_to: Optional[float] = None
    date_reg: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    source: Optional[str] = None
    event_id: Optional[int] = None
    status: Optional[str] = None
    type_name: Optional[str] = None
    relationship: Optional[str] = None
    vol_before: Optional[int] = None
    vol_after: Optional[int] = None
    perf_1w: Optional[float] = None
    perf_1m: Optional[float] = None
    dip: Optional[float] = None

    model_config = {"from_attributes": True}


class PaginatedTransactions(BaseModel):
    items: List[TransactionOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class WinrateOut(BaseModel):
    person: str
    wr: float
    wins: int
    losses: int
    total_trades: int
    pnl: float
    total: float
    tickers: List[str]


class PriceOut(BaseModel):
    ticker: str
    dates: List[str]
    values: List[Optional[float]]


class ClusterOut(BaseModel):
    ticker: str
    company: Optional[str] = None
    exchange: Optional[str] = None
    count: int
    persons: List[str]
    start: Optional[str] = None
    end: Optional[str] = None
    total_shares: int
    total_value: float


class BuyerOut(BaseModel):
    person: str
    role: Optional[str] = None
    count: int
    value: float
    tickers: List[str]


class HighlightsOut(BaseModel):
    clusters: List[ClusterOut]
    buys: List[TransactionOut]
    buyers: List[BuyerOut]


class SearchResult(BaseModel):
    total: int
    tickers: List[str]
    persons: List[str]
    items: List[TransactionOut]
