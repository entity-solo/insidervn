"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import { fmtNum } from "@/lib/format";
import { useWatchlist } from "@/store/watchlist";

export default function PersonPage() {
  const params = useParams();
  const name = decodeURIComponent(String(params.name || ""));
  const [selected, setSelected] = useState<Transaction | null>(null);
  const addPerson = useWatchlist((s) => s.addPerson);
  const persons = useWatchlist((s) => s.persons);
  const watching = persons.includes(name);

  const txs = useQuery({
    queryKey: ["tx-person", name],
    queryFn: () => api.transactions({ person: name, page_size: 200, sort: "date" }),
    enabled: !!name,
  });
  const wr = useQuery({ queryKey: ["winrate-all"], queryFn: () => api.winrates("all") });
  const found = wr.data?.find((w) => w.person.toLowerCase() === name.toLowerCase());

  return (
    <div className="panel">
      <div className="eyebrow">Hồ sơ insider</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div className="feed-title">{name}</div>
        <button
          className={"btn" + (watching ? " btn-accent" : "")}
          onClick={() => addPerson(name)}
          aria-pressed={watching}
        >
          {watching ? "✓ Đang theo dõi" : "+ Theo dõi"}
        </button>
      </div>

      {found && (
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-label">Win Rate</div>
            <div className="kpi-value" style={{ color: found.wr >= 50 ? "var(--buy)" : "var(--sell)" }}>
              {found.wr}%
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Thắng / Thua</div>
            <div className="kpi-value">
              {found.wins}/{found.losses}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">P/L trung bình</div>
            <div className="kpi-value" style={{ color: found.pnl >= 0 ? "var(--buy)" : "var(--sell)" }}>
              {found.pnl >= 0 ? "+" : ""}
              {found.pnl.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <div className="signal-count">
        {txs.data?.total ?? 0} giao dịch · {txs.data?.items.length ?? 0} hiển thị · tổng{" "}
        {fmtNum(txs.data?.items.reduce((a, t) => a + (t.executed ?? t.shares ?? 0), 0))} cp
      </div>
      <div className="tx-list">
        {txs.data?.items.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />
        ))}
        {!txs.isLoading && txs.data?.items.length === 0 && <div className="empty">Chưa có giao dịch.</div>}
      </div>

      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
