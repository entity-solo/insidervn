"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Transaction } from "@/lib/types";
import { fmtDate, fmtNum, fmtPrice, fmtPct, fmtMoney } from "@/lib/format";

export default function TransactionModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const router = useRouter();

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

  const t = tx;
  const isBuy = (t.type || "").includes("buy");
  const isPending = (t.executed ?? 0) === 0;
  const badge = isPending ? (isBuy ? "badge-reg_buy" : "badge-reg_sell") : isBuy ? "badge-buy" : "badge-sell";
  const badgeLabel = isPending ? (isBuy ? "Đăng ký mua" : "Đăng ký bán") : isBuy ? "Đã mua" : "Đã bán";
  const volume = (t.executed ?? 0) > 0 ? t.executed! : (t.shares ?? 0);
  const value = !isPending && volume > 0 && t.p_from ? volume * t.p_from : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết giao dịch ${t.ticker || ""}`}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="modal-ticker">{t.ticker}</div>
            <span className={"tx-badge " + badge}>{badgeLabel}</span>
          </div>
          <div className="tx-company">
            {t.company} · {t.exchange}
            {t.status ? ` · ${t.status}` : ""}
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
          <Row
            k="Người"
            v={
              t.person ? (
                <Link href={`/person/${encodeURIComponent(t.person)}`} className="modal-link" onClick={onClose}>
                  {t.person}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <Row k="Vị trí" v={t.role || "—"} />
          <Row k="Loại GD" v={t.type_name || "—"} />
          <Row k={isPending ? "KL đăng ký" : "Khối lượng"} v={fmtNum(volume) + " cp"} />
          <Row k="Giá" v={fmtPrice(t.p_from)} />
          <Row k="Ngày GD" v={fmtDate(t.date_from || t.date_reg)} />
          <Row k="KL trước" v={fmtNum(t.vol_before)} />
          <Row k="KL sau" v={fmtNum(t.vol_after)} />
          {(t.perf_1w != null || t.perf_1m != null) && (
            <>
              <Row
                k="Sau 1 tuần"
                v={
                  <span className={t.perf_1w != null ? (t.perf_1w >= 0 ? "pos" : "neg") : ""}>
                    {fmtPct(t.perf_1w)}
                  </span>
                }
              />
              <Row
                k="Sau 1 tháng"
                v={
                  <span className={t.perf_1m != null ? (t.perf_1m >= 0 ? "pos" : "neg") : ""}>
                    {fmtPct(t.perf_1m)}
                  </span>
                }
              />
            </>
          )}
        </div>

        {t.dip != null && t.dip <= -5 && (
          <div className="signal-note neg">
            📉 Mua khi giá đã giảm {Math.abs(t.dip)}% trong 28 ngày trước GD
          </div>
        )}
        {t.rally != null && t.rally >= 5 && (
          <div className="signal-note pos">
            📈 Bán sau khi giá đã tăng +{t.rally}% trong 4 tuần trước GD
          </div>
        )}
        {isPending && (
          <div className="signal-note" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
            ⏳ Đây là đăng ký — nguồn chưa có báo cáo khớp thực hiện
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {t.ticker && (
            <button
              className="btn btn-accent"
              style={{ flex: 1 }}
              onClick={() => router.push(`/stock/${t.ticker}`)}
            >
              Xem mã {t.ticker} →
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
