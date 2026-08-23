"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import PageHeader from "@/components/PageHeader";
import type { Transaction } from "@/lib/types";

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function StockPageInner() {
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTicker = searchParams.get("ticker") || "";
  const q = useDebounced(input, 350);

  useEffect(() => {
    if (urlTicker) setInput(urlTicker);
  }, [urlTicker]);

  const search = useQuery({
    queryKey: ["search", q],
    queryFn: () => api.search(q),
    enabled: q.trim().length > 0,
  });

  return (
    <div className="panel">
      <PageHeader
        eyebrow="Tra cứu"
        title="Tra mã / người"
        sub="Nhập mã (VD: VIC, FPT) hoặc tên lãnh đạo → xem biểu đồ & lịch sử giao dịch."
      />

      <div className="feed-toolbar">
        <div className="search-box">
          <span style={{ color: "var(--muted)" }}>🔍</span>
          <input
            placeholder="VD: VIC, FPT hoặc tên lãnh đạo…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Nhập mã hoặc tên"
          />
          {input && (
            <button className="chip-x" aria-label="Xóa" onClick={() => setInput("")} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {search.isFetching && q.trim() && <div className="skeleton" />}

      {search.data && !search.isFetching && (
        <>
          <div className="signal-section">
            <div className="signal-section-title">Mã liên quan</div>
            <div>
              {search.data.tickers.length ? (
                search.data.tickers.map((t) => (
                  <button key={t} className="filter-btn" style={{ marginRight: 6 }} onClick={() => router.push(`/stock/${t}`)}>
                    🏷️ {t}
                  </button>
                ))
              ) : (
                <span className="tx-company">—</span>
              )}
            </div>
          </div>
          <div className="signal-section">
            <div className="signal-section-title">Người liên quan</div>
            <div>
              {search.data.persons.length ? (
                search.data.persons.map((p) => (
                  <button
                    key={p}
                    className="filter-btn"
                    style={{ marginRight: 6 }}
                    onClick={() => router.push(`/person/${encodeURIComponent(p)}`)}
                  >
                    👤 {p}
                  </button>
                ))
              ) : (
                <span className="tx-company">—</span>
              )}
            </div>
          </div>
          <div className="signal-count">{search.data.total.toLocaleString("vi-VN")} giao dịch khớp</div>
          <div className="tx-list">
            {search.data.items.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />
            ))}
          </div>
        </>
      )}

      {!q.trim() && (
        <div className="empty-card">
          <div>Gõ để tìm theo mã cổ phiếu hoặc tên lãnh đạo.</div>
          <div className="tx-company">Mẹo: nhấn Ctrl + K để tìm nhanh từ bất kỳ đâu.</div>
        </div>
      )}

      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={<div className="panel"><div className="skeleton" /></div>}>
      <StockPageInner />
    </Suspense>
  );
}
