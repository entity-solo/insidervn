"use client";

import { useRouter } from "next/navigation";
import type { Transaction } from "@/lib/types";
import { fmtDate, fmtNum, fmtPrice, fmtVal, fmtPct } from "@/lib/format";

export default function TransactionModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const router = useRouter();
  const isBuy = (tx.type || "").includes("buy");
  const isPending = tx.executed == null;
  const badge = isPending ? (isBuy ? "badge-reg_buy" : "badge-reg_sell") : isBuy ? "badge-buy" : "badge-sell";
  const badgeLabel = isPending ? (isBuy ? "Đăng ký mua" : "Đăng ký bán") : isBuy ? "Đã mua" : "Đã bán";
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-ticker">{tx.ticker}</div>
          <div className="tx-company">
            {tx.company} · {tx.exchange}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <span className={"tx-badge " + badge}>{badgeLabel}</span>
        </div>
        <Row k="Người" v={tx.person || "—"} />
        <Row k="Vị trí" v={tx.role || "—"} />
        <Row k="Loại GD" v={tx.type_name || "—"} />
        <Row k="Đăng ký" v={fmtNum(tx.shares) + " cp"} />
        <Row k="Thực hiện" v={fmtNum(tx.executed) + " cp"} />
        <Row k="Giá" v={fmtPrice(tx.p_from)} />
        <Row k="Ngày ĐK" v={fmtDate(tx.date_reg)} />
        <Row k="Từ ngày" v={fmtDate(tx.date_from)} />
        <Row k="Đến ngày" v={fmtDate(tx.date_to)} />
        <Row k="KL trước" v={fmtNum(tx.vol_before)} />
        <Row k="KL sau" v={fmtNum(tx.vol_after)} />
        <Row k="Perf 1T" v={<span className={tx.perf_1w != null ? (tx.perf_1w >= 0 ? "pos" : "neg") : ""}>{fmtPct(tx.perf_1w)}</span>} />
        <Row k="Perf 1Th" v={<span className={tx.perf_1m != null ? (tx.perf_1m >= 0 ? "pos" : "neg") : ""}>{fmtPct(tx.perf_1m)}</span>} />
        {tx.dip != null && tx.dip <= -5 && (
          <div className="modal-row">
            <span className="modal-k">Ghi chú</span>
            <span className="modal-v neg">Mua khi giá đã giảm {Math.abs(tx.dip)}% trước GD</span>
          </div>
        )}
        {tx.ticker && (
          <button
            className="btn btn-accent"
            style={{ marginTop: 14, width: "100%" }}
            onClick={() => router.push(`/stock/${tx.ticker}`)}
          >
            Xem mã {tx.ticker} →
          </button>
        )}
        <button className="btn" style={{ marginTop: 8, width: "100%" }} onClick={onClose}>
          Đóng
        </button>
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
