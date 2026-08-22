"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import { fmtNum, fmtMoney } from "@/lib/format";
import { useWatchlist } from "@/store/watchlist";

export default function PersonPage() {
  const params = useParams();
  const name = decodeURIComponent(String(params.name || ""));
  const [selected, setSelected] = useState<Transaction | null>(null);
  const { addPerson, removePerson, persons } = useWatchlist();
  const watching = persons.includes(name);

  const txs = useQuery({
    queryKey: ["tx-person", name],
    queryFn: () => api.transactions({ person: name, page_size: 200, sort: "date" }),
    enabled: !!name,
  });
  const wr = useQuery({
    queryKey: ["winrate-person", name],
    queryFn: () => api.winrates("all", name),
    enabled: !!name,
  });
  const found = wr.data?.find((w) => w.person.toLowerCase() === name.toLowerCase());

  const stats = useMemo(() => {
    const items = txs.data?.items ?? [];
    let buyVol = 0,
      sellVol = 0,
      buyVal = 0;
    const roles = new Map<string, number>();
    const tickers = new Map<string, number>();
    for (const t of items) {
      const vol = (t.executed ?? 0) > 0 ? t.executed! : (t.shares ?? 0);
      if ((t.type || "").includes("buy")) {
        buyVol += vol;
        if (t.p_from) buyVal += vol * t.p_from;
      } else if ((t.type || "").includes("sell")) sellVol += vol;
      if (t.role) roles.set(t.role, (roles.get(t.role) || 0) + 1);
      if (t.ticker) tickers.set(t.ticker, (tickers.get(t.ticker) || 0) + 1);
    }
    const topRole = [...roles.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const topTickers = [...tickers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map((e) => e[0]);
    return { buyVol, sellVol, buyVal, topRole, topTickers };
  }, [txs.data]);

  return (
    <div className="panel">
      <div className="eyebrow">Hồ sơ insider</div>
      <div className="ticker-hero">
        <div>
          <div className="feed-title" style={{ margin: 0 }}>{name}</div>
          <div className="tx-company">{stats.topRole || "—"}</div>
        </div>
        <button
          className={"btn" + (watching ? " btn-accent" : "")}
          onClick={() => (watching ? removePerson(name) : addPerson(name))}
          aria-pressed={watching}
        >
          {watching ? "✓ Đang theo dõi" : "+ Theo dõi"}
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Win Rate</div>
          <div
            className="kpi-value"
            style={{ color: found ? (found.wr >= 50 ? "var(--buy)" : "var(--sell)") : "var(--muted)" }}
          >
            {found ? found.wr + "%" : "—"}
          </div>
          <div className="kpi-sub">{found ? `${found.wins} thắng / ${found.losses} thua` : "chưa đủ dữ liệu"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">P/L trung bình</div>
          <div
            className="kpi-value"
            style={{ color: found ? (found.pnl >= 0 ? "var(--buy)" : "var(--sell)") : "var(--muted)" }}
          >
            {found ? (found.pnl >= 0 ? "+" : "") + found.pnl.toFixed(1) + "%" : "—"}
          </div>
          <div className="kpi-sub">sau 1 tháng mua</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tổng mua</div>
          <div className="kpi-value" style={{ color: "var(--buy)" }}>{fmtNum(stats.buyVol)} cp</div>
          <div className="kpi-sub">≈ {fmtMoney(stats.buyVal)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tổng bán</div>
          <div className="kpi-value" style={{ color: "var(--sell)" }}>{fmtNum(stats.sellVol)} cp</div>
          <div className="kpi-sub">{txs.data?.total ?? 0} GD tổng cộng</div>
        </div>
      </div>

      {stats.topTickers.length > 0 && (
        <>
          <div className="signal-count">Mã hay giao dịch</div>
          <div>
            {stats.topTickers.map((t) => (
              <Link key={t} href={`/stock/${t}`} className="chip" style={{ cursor: "pointer" }}>
                {t}
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="signal-count">
        {txs.data?.items.length ?? 0} giao dịch hiển thị
      </div>
      <div className="tx-list">
        {txs.data?.items.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />
        ))}
        {!txs.isLoading && txs.data?.items.length === 0 && <div className="empty">Chưa có giao dịch.</div>}
      </div>

      {selected && <TransactionModal tx={selected} items={txs.data?.items} onClose={() => setSelected(null)} />}
    </div>
  );
}
