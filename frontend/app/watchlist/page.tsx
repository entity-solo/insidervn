"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useWatchlist } from "@/store/watchlist";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import type { Transaction } from "@/lib/types";

export default function WatchlistPage() {
  const { tickers, persons, removeTicker, removePerson } = useWatchlist();
  const [selected, setSelected] = useState<Transaction | null>(null);

  const { data: trades, isLoading } = useQuery({
    queryKey: ["wl-trades", tickers, persons],
    queryFn: async () => {
      const queries = [...tickers, ...persons].map((q) => api.search(q).then((r) => r.items));
      const lists = await Promise.all(queries);
      const map = new Map<number, Transaction>();
      lists.flat().forEach((t) => map.set(t.id, t));
      return [...map.values()].sort((a, b) => (b.date_reg || "").localeCompare(a.date_reg || "")).slice(0, 60);
    },
    enabled: tickers.length + persons.length > 0,
  });

  return (
    <div className="panel">
      <div>
        <div className="eyebrow">Cá nhân</div>
        <div className="feed-title">Theo dõi</div>
        <div className="feed-subtitle">Theo dõi lãnh đạo và mã CP bạn quan tâm</div>
      </div>

      <div className="wl-stats">
        <div className="wl-stat-card">
          <div>
            <div className="wl-stat-value">{persons.length}</div>
            <div className="wl-stat-label">Người</div>
          </div>
        </div>
        <div className="wl-stat-card">
          <div>
            <div className="wl-stat-value">{tickers.length}</div>
            <div className="wl-stat-label">Mã CP</div>
          </div>
        </div>
        <div className="wl-stat-card">
          <div>
            <div className="wl-stat-value">{trades?.length ?? 0}</div>
            <div className="wl-stat-label">Giao dịch</div>
          </div>
        </div>
        <div className="wl-stat-card">
          <div>
            <div className="wl-stat-value" style={{ color: "var(--accent)" }}>
              Live
            </div>
            <div className="wl-stat-label">Nguồn</div>
          </div>
        </div>
      </div>

      <div className="signal-section">
        <div className="signal-section-title">Mã CP đang theo dõi</div>
        {tickers.length === 0 && <div className="tx-company">Chưa có</div>}
        <div>
          {tickers.map((t) => (
            <button key={t} className="chip" style={{ cursor: "pointer" }} onClick={() => removeTicker(t)} title="Xoá">
              {t} ✕
            </button>
          ))}
        </div>
      </div>
      <div className="signal-section">
        <div className="signal-section-title">Lãnh đạo đang theo dõi</div>
        {persons.length === 0 && <div className="tx-company">Chưa có</div>}
        <div>
          {persons.map((p) => (
            <button key={p} className="chip" style={{ cursor: "pointer" }} onClick={() => removePerson(p)} title="Xoá">
              {p} ✕
            </button>
          ))}
        </div>
      </div>

      <div className="signal-section">
        <div className="signal-section-title">Giao dịch gần đây</div>
        {isLoading && <div className="skeleton" />}
        <div className="tx-list">
          {(trades ?? []).map((tx) => (
            <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />
          ))}
          {!isLoading && (trades?.length ?? 0) === 0 && <div className="empty">Chưa có giao dịch</div>}
        </div>
      </div>

      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
