"use client";

import type { Transaction } from "@/lib/types";
import { fmtDate, fmtPct } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  buy: "Đã mua",
  sell: "Đã bán",
  register_buy: "Đăng ký mua",
  register_sell: "Đăng ký bán",
};
const TYPE_CLS: Record<string, string> = {
  buy: "badge-buy",
  sell: "badge-sell",
  register_buy: "badge-reg_buy",
  register_sell: "badge-reg_sell",
};

export default function TransactionRow({ tx, onClick }: { tx: Transaction; onClick: () => void }) {
  const isPending = (tx.executed ?? 0) === 0;
  const isBuy = (tx.type || "").includes("buy");
  const badgeType = isPending ? (isBuy ? "register_buy" : "register_sell") : (isBuy ? "buy" : "sell");
  const volume = (tx.executed ?? 0) > 0 ? tx.executed! : (tx.shares ?? 0);
  // A registration whose whole window has passed without an execution report.
  const today = new Date().toISOString().slice(0, 10);
  const overdue =
    isPending && !!(tx.date_to || tx.date_from || tx.date_reg) &&
    (tx.date_to || tx.date_from || tx.date_reg)! < today;
  return (
    <div
      className={"tx-item " + (tx.type || "")}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
       <div className="tx-ticker">{tx.ticker}</div>
      <div className="tx-main">
        <div className="tx-person">
          {tx.person}{" "}
          {tx.person_type === "org" && <span className="tx-org">Tổ chức</span>}
          <span style={{ color: "var(--muted)", fontWeight: 500 }}> · {tx.role}</span>
        </div>
        <div className="tx-company">
          {tx.company} · {tx.exchange}
        </div>
      </div>
      <div>
        <span className={"tx-badge " + (TYPE_CLS[badgeType] || "")}>
          {isPending ? (isBuy ? "Đăng ký mua" : "Đăng ký bán") : TYPE_LABEL[badgeType] || tx.type}
          {overdue && <span className="tx-overdue"> · quá hạn</span>}
        </span>
      </div>
      <div className="tx-right">
        <div className="tx-meta">{fmtDate(tx.date_reg)}</div>
        <div className="tx-meta">
          {volume.toLocaleString("vi-VN")} cp
        </div>
        {tx.perf_1m != null && (
          <div className={"tx-meta " + (tx.perf_1m >= 0 ? "pos" : "neg")}>{fmtPct(tx.perf_1m)}</div>
        )}
      </div>
    </div>
  );
}
