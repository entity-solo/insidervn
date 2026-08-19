from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models.transaction import Transaction
from ..schemas import BuyerOut, ClusterOut, HighlightsOut, TransactionOut


def _date_key(d: Transaction) -> str:
    return d.date_from or d.date_reg


def _parse_date(s: str):
    return datetime.strptime(s, "%Y-%m-%d").date()


def get_clusters(db: Session, window_days: int = 14, exchange: str = "all") -> list[ClusterOut]:
    buys = db.query(Transaction).filter(Transaction.type == "buy").all()
    by_ticker: dict[str, list[Transaction]] = {}
    for d in buys:
        key = _date_key(d)
        if not key:
            continue
        by_ticker.setdefault(d.ticker, []).append(d)

    out: list[ClusterOut] = []
    for ticker, txs in by_ticker.items():
        txs.sort(key=lambda x: _date_key(x))
        i = 0
        while i < len(txs):
            base = txs[i]
            base_d = _parse_date(_date_key(base))
            members = [base]
            j = i + 1
            while j < len(txs):
                t = txs[j]
                t_d = _parse_date(_date_key(t))
                if (t_d - base_d).days > window_days:
                    break
                if t.person != base.person and not any(m.person == t.person for m in members):
                    members.append(t)
                j += 1
            persons = sorted({m.person for m in members})
            if len(persons) >= 2:
                start = _date_key(members[0])
                end = _date_key(members[-1])
                total_shares = sum((m.executed or m.shares or 0) for m in members)
                total_value = sum((m.executed or m.shares or 0) * (m.p_from or 0) for m in members)
                out.append(
                    ClusterOut(
                        ticker=ticker,
                        company=base.company,
                        exchange=base.exchange,
                        count=len(persons),
                        persons=persons,
                        start=start,
                        end=end,
                        total_shares=total_shares,
                        total_value=total_value,
                    )
                )
            i += 1

    seen: set[str] = set()
    dedup: list[ClusterOut] = []
    for c in out:
        sig = f"{c.ticker}|{c.start}|{','.join(c.persons)}"
        if sig in seen:
            continue
        seen.add(sig)
        dedup.append(c)

    dedup.sort(key=lambda c: (c.start or "", c.count), reverse=True)
    if exchange != "all":
        dedup = [c for c in dedup if c.exchange == exchange]
    return dedup


def get_dip_buys(db: Session, exchange: str = "all", limit: int = 80) -> list[Transaction]:
    q = db.query(Transaction).filter(
        Transaction.type == "buy",
        Transaction.dip != None,  # noqa: E711
        Transaction.dip <= -5,
    )
    if exchange != "all":
        q = q.filter(Transaction.exchange == exchange)
    q = q.order_by(Transaction.dip.asc())
    return q.limit(limit).all()


def get_highlights(db: Session, exchange: str = "all", window_days: int = 14, n: int = 8) -> HighlightsOut:
    clusters = get_clusters(db, window_days, exchange)[:5]

    buys_q = db.query(Transaction).filter(
        Transaction.type == "buy",
        Transaction.executed != None,  # noqa: E711
        Transaction.p_from != None,  # noqa: E711
    )
    if exchange != "all":
        buys_q = buys_q.filter(Transaction.exchange == exchange)
    buys = (
        buys_q.order_by((func.coalesce(Transaction.executed, 0) * func.coalesce(Transaction.p_from, 0)).desc())
        .limit(n)
        .all()
    )

    all_buys = db.query(Transaction).filter(Transaction.type == "buy").all()
    agg: dict[str, dict] = {}
    for d in all_buys:
        if exchange != "all" and d.exchange != exchange:
            continue
        if not d.person:
            continue
        m = agg.setdefault(d.person, {"person": d.person, "role": d.role, "count": 0, "value": 0.0, "tickers": set()})
        m["count"] += 1
        m["value"] += (d.executed or d.shares or 0) * (d.p_from or 0)
        m["tickers"].add(d.ticker)
    buyers = [
        BuyerOut(**{k: (sorted(v) if k == "tickers" else v) for k, v in b.items()})
        for b in sorted(agg.values(), key=lambda x: -x["value"])[:n]
    ]

    return HighlightsOut(clusters=clusters, buys=[TransactionOut.model_validate(b) for b in buys], buyers=buyers)
