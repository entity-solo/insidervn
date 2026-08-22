import json
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models.price import Price
from ..models.transaction import Transaction
from ..schemas import BuyerOut, ClusterOut, HighlightsOut, TransactionOut


def _date_key(d: Transaction) -> str:
    return d.date_from or d.date_reg


def _parse_date(s: str):
    return datetime.strptime(s, "%Y-%m-%d").date()


def get_clusters(db: Session, window_days: int = 14, exchange: str = "all", side: str = "buy", limit: int = 100) -> list[ClusterOut]:
    buys = db.query(Transaction).filter(Transaction.type == side).all()
    by_ticker: dict[str, list[Transaction]] = {}
    for d in buys:
        key = _date_key(d)
        if not key:
            continue
        by_ticker.setdefault(d.ticker, []).append(d)

    out: list[ClusterOut] = []
    for ticker, txs in by_ticker.items():
        txs.sort(key=lambda x: _date_key(x))
        n = len(txs)
        used = [False] * n
        i = 0
        while i < n:
            if used[i]:
                i += 1
                continue
            base_d = _parse_date(_date_key(txs[i]))
            persons = {txs[i].person}
            idxs = [i]
            j = i + 1
            while j < n:
                t_d = _parse_date(_date_key(txs[j]))
                if (t_d - base_d).days > window_days:
                    break
                persons.add(txs[j].person)
                idxs.append(j)
                j += 1
            if len(persons) >= 2:
                members = [txs[k] for k in idxs]
                base = members[0]
                ordered = sorted({m.person for m in members})
                start = _date_key(base)
                end = _date_key(members[-1])
                total_shares = sum((m.executed or m.shares or 0) for m in members)
                total_value = sum((m.executed or m.shares or 0) * (m.p_from or 0) for m in members)
                out.append(
                    ClusterOut(
                        ticker=ticker,
                        company=base.company,
                        exchange=base.exchange,
                        count=len(ordered),
                        persons=ordered,
                        start=start,
                        end=end,
                        total_shares=total_shares,
                        total_value=total_value,
                    )
                )
                for k in idxs:
                    used[k] = True
            else:
                used[i] = True
            i += 1

    seen: set[str] = set()
    dedup: list[ClusterOut] = []
    for c in out:
        sig = f"{c.ticker}|{c.start}|{','.join(c.persons)}"
        if sig in seen:
            continue
        seen.add(sig)
        dedup.append(c)

    # Merge same-ticker clusters that share people and happen close in time,
    # so one trading event does not show up as several near-duplicate cards.
    changed = True
    while changed:
        changed = False
        res: list[ClusterOut] = []
        for c in dedup:
            target = None
            for r in res:
                if r.ticker != c.ticker or not (set(r.persons) & set(c.persons)):
                    continue
                if r.start <= c.start:
                    gap = (_parse_date(c.start) - _parse_date(r.end)).days
                else:
                    gap = (_parse_date(r.start) - _parse_date(c.end)).days
                if gap <= window_days:
                    target = r
                    break
            if target is not None:
                ps = sorted(set(target.persons) | set(c.persons))
                target.count = len(ps)
                target.persons = ps
                target.start = min(target.start, c.start)
                target.end = max(target.end, c.end)
                target.total_shares += c.total_shares
                target.total_value += c.total_value
                changed = True
            else:
                res.append(c)
        dedup = res

    dedup.sort(key=lambda c: (c.start or "", c.count), reverse=True)
    if exchange != "all":
        dedup = [c for c in dedup if c.exchange == exchange]
    if limit and limit > 0:
        dedup = dedup[:limit]
    return dedup


def get_dip_buys(db: Session, exchange: str = "all", limit: int = 80) -> list[Transaction]:
    q = db.query(Transaction).filter(
        Transaction.type == "buy",
        Transaction.dip != None,  # noqa: E711
        Transaction.dip <= -5,
    )
    if exchange != "all":
        q = q.filter(Transaction.exchange == exchange)
    q = q.order_by(func.coalesce(Transaction.date_from, Transaction.date_reg).desc())
    return q.limit(limit).all()


def get_largest(db: Session, side: str = "buy", exchange: str = "all", limit: int = 80) -> list[Transaction]:
    q = db.query(Transaction).filter(Transaction.type == side, Transaction.executed != None)  # noqa: E711
    if exchange != "all":
        q = q.filter(Transaction.exchange == exchange)
    q = q.order_by(Transaction.executed.desc())
    return q.limit(limit).all()


def get_treasury(db: Session, exchange: str = "all", limit: int = 100) -> list[Transaction]:
    q = db.query(Transaction).filter(Transaction.role_key == "treasury")
    if exchange != "all":
        q = q.filter(Transaction.exchange == exchange)
    q = q.order_by(func.coalesce(Transaction.date_from, Transaction.date_reg).desc())
    return q.limit(limit).all()


def get_rally_sells(db: Session, exchange: str = "all", limit: int = 80) -> list[TransactionOut]:
    q = db.query(Transaction).filter(
        Transaction.type == "sell",
        Transaction.rally != None,  # noqa: E711
        Transaction.rally >= 5,
    )
    if exchange != "all":
        q = q.filter(Transaction.exchange == exchange)
    q = q.order_by(func.coalesce(Transaction.date_from, Transaction.date_reg).desc())
    rows = q.limit(limit).all()
    return [TransactionOut.model_validate(r) for r in rows]


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
