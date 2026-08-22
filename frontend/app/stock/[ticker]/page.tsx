"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import PriceChart from "@/components/PriceChart";
import { useWatchlist } from "@/store/watchlist";
import { fmtNum, fmtMoney } from "@/lib/format";

export default function TickerPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = String(params.ticker || "").toUpperCase();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [jump, setJump] = useState("");
  const { tickers: wlTickers, addTicker, removeTicker } = useWatchlist();
  const watching = wlTickers.includes(ticker);

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

  const stats = useMemo(() => {
    const items = txs.data?.items ?? [];
    let buys = 0,
      sells = 0,
      buyVol = 0,
      sellVol = 0,
      buyVal = 0;
    for (const t of items) {
      const vol = (t.executed ?? 0) > 0 ? t.executed! : (t.shares ?? 0);
      if ((t.type || "").includes("buy")) {
        buys += 1;
        buyVol += vol;
        if (t.p_from) buyVal += vol * t.p_from;
      } else if ((t.type || "").includes("sell")) {
        sells += 1;
        sellVol += vol;
      }
    }
    return { buys, sells, buyVol, sellVol, buyVal, net: buyVol - sellVol };
  }, [txs.data]);

  const lastPrice = useMemo(() => {
    if (!price.data) return null;
    const vs = price.data.values.filter((v) => v != null) as number[];
    if (vs.length === 0) return null;
    const cur = vs[vs.length - 1];
    const prev = vs.length > 1 ? vs[vs.length - 2] : null;
    const chg = prev ? ((cur - prev) / prev) * 100 : null;
    return { cur, chg };
  }, [price.data]);

  return (
    <div className="panel">
      <div className="eyebrow">Tra cứu</div>
      <div className="ticker-hero">
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span className="feed-title" style={{ margin: 0 }}>{ticker || "—"}</span>
            {lastPrice && (
              <>
                <span style={{ fontSize: 22, fontWeight: 800 }}>{lastPrice.cur.toLocaleString("vi-VN")}đ</span>
                {lastPrice.chg != null && (
                  <span className={"tx-badge " + (lastPrice.chg >= 0 ? "badge-buy" : "badge-sell")}>
                    {lastPrice.chg >= 0 ? "+" : ""}
                    {lastPrice.chg.toFixed(1)}%
                  </span>
                )}
              </>
            )}
          </div>
          <div className="tx-company">
            {txs.data?.items[0]?.company || ""}
            {txs.data?.items[0]?.exchange ? ` · ${txs.data.items[0].exchange}` : ""}
          </div>
        </div>
        {ticker && (
          <button
            className={"btn" + (watching ? " btn-accent" : "")}
            onClick={() => (watching ? removeTicker(ticker) : addTicker(ticker))}
            aria-pressed={watching}
          >
            {watching ? "✓ Đang theo dõi" : "+ Theo dõi mã"}
          </button>
        )}
      </div>

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

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Lần mua</div>
          <div className="kpi-value" style={{ color: "var(--buy)" }}>{stats.buys}</div>
          <div className="kpi-sub">{fmtNum(stats.buyVol)} cp · {fmtMoney(stats.buyVal)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Lần bán</div>
          <div className="kpi-value" style={{ color: "var(--sell)" }}>{stats.sells}</div>
          <div className="kpi-sub">{fmtNum(stats.sellVol)} cp</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Dòng tiền ròng</div>
          <div className="kpi-value" style={{ color: stats.net >= 0 ? "var(--buy)" : "var(--sell)" }}>
            {stats.net >= 0 ? "+" : ""}
            {fmtNum(stats.net)} cp
          </div>
          <div className="kpi-sub">trong {txs.data?.items.length ?? 0} GD gần nhất</div>
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
