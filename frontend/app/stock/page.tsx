"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import type { Transaction } from "@/lib/types";

function StockPageInner() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTicker = searchParams.get("ticker") || "";

  useEffect(() => {
    if (urlTicker) setQ(urlTicker);
  }, [urlTicker]);

  const search = useQuery({
    queryKey: ["search", q],
    queryFn: () => api.search(q),
    enabled: q.trim().length > 0,
  });

  return (
    <div className="panel">
      <div className="eyebrow">Tra cứu giao dịch nội bộ</div>
      <div className="feed-title">Tra mã / người</div>
      <div className="feed-subtitle">Nhập mã (VD: VIC, FPT) hoặc tên lãnh đạo → xem biểu đồ & lịch sử</div>
      <div className="feed-controls">
        <div className="search-box">
          <span style={{ color: "var(--muted)" }}>🔍</span>
          <input
            placeholder="VD: VIC, FPT hoặc tên lãnh đạo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Nhập mã hoặc tên"
          />
        </div>
      </div>

      {search.data && (
        <>
          <div className="signal-section">
            <div className="signal-section-title">Mã liên quan</div>
            <div>
              {search.data.tickers.length ? (
                search.data.tickers.map((t) => (
                  <button key={t} className="chip" style={{ cursor: "pointer" }} onClick={() => router.push(`/stock/${t}`)}>
                    {t}
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
                    className="chip"
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/person/${encodeURIComponent(p)}`)}
                  >
                    {p}
                  </button>
                ))
              ) : (
                <span className="tx-company">—</span>
              )}
            </div>
          </div>
          <div className="signal-count">{search.data.total} giao dịch</div>
          <div className="tx-list">
            {search.data.items.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />
            ))}
          </div>
        </>
      )}

      {selected && <TransactionModal tx={selected} items={search.data?.items} onClose={() => setSelected(null)} />}
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
