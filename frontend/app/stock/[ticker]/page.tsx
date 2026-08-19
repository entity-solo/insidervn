"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import PriceChart from "@/components/PriceChart";

export default function TickerPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = String(params.ticker || "").toUpperCase();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [jump, setJump] = useState("");

  const price = useQuery({
    queryKey: ["price", ticker],
    queryFn: () => api.price(ticker),
    enabled: !!ticker,
  });
  const txs = useQuery({
    queryKey: ["tx-ticker", ticker],
    queryFn: () => api.transactions({ ticker, page_size: 100, sort: "date" }),
    enabled: !!ticker,
  });

  return (
    <div className="panel">
      <div className="eyebrow">Tra cứu</div>
      <div className="feed-title">{ticker || "—"}</div>
      <div className="feed-controls">
        <div className="search-box">
          <span style={{ color: "var(--muted)" }}>🔍</span>
          <input
            placeholder="Nhảy sang mã khác…"
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && jump.trim()) router.push(`/stock/${jump.trim().toUpperCase()}`);
            }}
            aria-label="Nhảy sang mã khác"
          />
        </div>
      </div>

      {price.data && <PriceChart data={price.data} />}

      <div className="signal-count">
        {txs.data?.total ?? 0} giao dịch nội bộ · {txs.data?.items.length ?? 0} hiển thị
      </div>
      <div className="tx-list">
        {txs.data?.items.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />
        ))}
        {!txs.isLoading && txs.data?.items.length === 0 && <div className="empty">Chưa có giao dịch cho mã này.</div>}
      </div>

      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
