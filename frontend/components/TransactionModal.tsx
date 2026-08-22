"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@/lib/types";
import { api } from "@/lib/api";
import { fmtDate, fmtNum, fmtPrice, fmtPct, fmtMoney } from "@/lib/format";

function Sparkline({ ticker }: { ticker: string }) {
  const price = useQuery({
    queryKey: ["price", ticker],
    queryFn: () => api.price(ticker),
    enabled: !!ticker,
    staleTime: 300_000,
  });
  const points = useMemo(() => {
    if (!price.data) return [];
    return price.data.dates
      .map((d, i) => ({ d, v: price.data!.values[i] }))
      .filter((p) => p.v != null) as { d: string; v: number }[];
  }, [price.data]);

  if (!ticker || price.isLoading || points.length < 2) return null;
  const W = 320;
  const H = 56;
  const vs = points.map((p) => p.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const step = W / (points.length - 1);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(H - ((p.v - min) / span) * (H - 6) - 3).toFixed(1)}`);
  const up = vs[vs.length - 1] >= vs[0];
  const stroke = up ? "var(--buy)" : "var(--sell)";
  return (
    <div style={{ marginTop: 12 }}>
      <div className="modal-k" style={{ marginBottom: 4 }}>Giá 1 năm gần nhất</div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
        <polyline
          points={coords.join(" ")}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
        <span>{fmtDate(points[0].d)}</span>
        <span style={{ color: stroke, fontWeight: 700 }}>{fmtPrice(vs[vs.length - 1])}</span>
        <span>{fmtDate(points[points.length - 1].d)}</span>
      </div>
    </div>
  );
}

export default function TransactionModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const router = useRouter();
  const isBuy = (tx.type || "").includes("buy");
  const isPending = (tx.executed ?? 0) === 0;
  const badge = isPending ? (isBuy ? "badge-reg_buy" : "badge-reg_sell") : isBuy ? "badge-buy" : "badge-sell";
  const badgeLabel = isPending ? (isBuy ? "Đăng ký mua" : "Đăng ký bán") : isBuy ? "Đã mua" : "Đã bán";
  const volume = (tx.executed ?? 0) > 0 ? tx.executed! : (tx.shares ?? 0);
  const value = volume > 0 && tx.p_from ? volume * tx.p_from : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết giao dịch ${tx.ticker || ""}`}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="modal-ticker">{tx.ticker}</div>
            <span className={"tx-badge " + badge}>{badgeLabel}</span>
          </div>
          <div className="tx-company">
            {tx.company} · {tx.exchange}
          </div>
        </div>

        {value != null && (
          <div className="tx-value-hero">
            <span className="modal-k">Giá trị giao dịch</span>
            <span
              className="tx-value-num"
              style={{ color: isBuy ? "var(--buy)" : "var(--sell)" }}
            >
              ≈ {fmtMoney(value)}
            </span>
          </div>
        )}

        <div className="modal-grid">
          <Row k="Người" v={tx.person || "—"} />
          <Row k="Vị trí" v={tx.role || "—"} />
          <Row k="Loại GD" v={tx.type_name || "—"} />
          <Row k="Khối lượng" v={fmtNum(volume) + " cp"} />
          <Row k="Giá" v={fmtPrice(tx.p_from)} />
          <Row k="Ngày GD" v={fmtDate(tx.date_from || tx.date_reg)} />
          <Row k="KL trước" v={fmtNum(tx.vol_before)} />
          <Row k="KL sau" v={fmtNum(tx.vol_after)} />
          {(tx.perf_1w != null || tx.perf_1m != null) && (
            <>
              <Row
                k="Sau 1 tuần"
                v={
                  <span className={tx.perf_1w != null ? (tx.perf_1w >= 0 ? "pos" : "neg") : ""}>
                    {fmtPct(tx.perf_1w)}
                  </span>
                }
              />
              <Row
                k="Sau 1 tháng"
                v={
                  <span className={tx.perf_1m != null ? (tx.perf_1m >= 0 ? "pos" : "neg") : ""}>
                    {fmtPct(tx.perf_1m)}
                  </span>
                }
              />
            </>
          )}
        </div>

        {tx.dip != null && tx.dip <= -5 && (
          <div className="signal-note neg">
            📉 Mua khi giá đã giảm {Math.abs(tx.dip)}% trong 28 ngày trước GD
          </div>
        )}
        {tx.rally != null && tx.rally >= 5 && (
          <div className="signal-note pos">
            📈 Bán sau khi giá đã tăng +{tx.rally}% trong 4 tuần trước GD
          </div>
        )}

        <Sparkline ticker={tx.ticker || ""} />

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {tx.ticker && (
            <button
              className="btn btn-accent"
              style={{ flex: 1 }}
              onClick={() => router.push(`/stock/${tx.ticker}`)}
            >
              Xem mã {tx.ticker} →
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="modal-row">
      <span className="modal-k">{k}</span>
      <span className="modal-v">{v}</span>
    </div>
  );
}
