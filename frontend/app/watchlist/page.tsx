"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useWatchlist } from "@/store/watchlist";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import PageHeader from "@/components/PageHeader";
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

  const empty = tickers.length === 0 && persons.length === 0;

  return (
    <div className="panel">
      <PageHeader
        eyebrow="Cá nhân"
        title="Theo dõi"
        sub="Danh sách lãnh đạo và mã cổ phiếu bạn quan tâm — đăng nhập để đồng bộ giữa các thiết bị."
      />

      {!empty && (
        <div className="kpi-row" style={{ marginTop: 14 }}>
          <div className="kpi-card">
            <div className="kpi-label">Người</div>
            <div className="kpi-value">{persons.length}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Mã CP</div>
            <div className="kpi-value">{tickers.length}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Giao dịch gần đây</div>
            <div className="kpi-value">{trades?.length ?? 0}</div>
          </div>
        </div>
      )}

      {empty ? (
        <div className="empty-card">
          <div>Chưa theo dõi ai cả.</div>
          <div className="tx-company">Vào Tra cứu hoặc Tín hiệu, bấm "+ Theo dõi" trên mã/người bạn quan tâm.</div>
        </div>
      ) : (
        <>
          {tickers.length > 0 && (
            <div className="signal-section">
              <div className="signal-section-title">Mã CP đang theo dõi</div>
              <div>
                {tickers.map((t) => (
                  <span key={t} className="wl-chip">
                    <Link href={`/stock/${t}`}>{t}</Link>
                    <button onClick={() => removeTicker(t)} title="Bỏ theo dõi" aria-label={`Bỏ theo dõi ${t}`}>✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {persons.length > 0 && (
            <div className="signal-section">
              <div className="signal-section-title">Lãnh đạo đang theo dõi</div>
              <div>
                {persons.map((p) => (
                  <span key={p} className="wl-chip">
                    <Link href={`/person/${encodeURIComponent(p)}`}>{p}</Link>
                    <button onClick={() => removePerson(p)} title="Bỏ theo dõi" aria-label={`Bỏ theo dõi ${p}`}>✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
        </>
      )}

      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
