"use client";

import type { Transaction } from "@/lib/types";
import { fmtDate, fmtNum, fmtVal } from "@/lib/format";

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
  const cls = tx.type?.startsWith("register") ? tx.type : tx.type || "";
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
          {tx.person} <span style={{ color: "var(--muted)", fontWeight: 500 }}>· {tx.role}</span>
        </div>
        <div className="tx-company">
          {tx.company} · {tx.exchange}
        </div>
      </div>
      <div>
        <span className={"tx-badge " + (TYPE_CLS[tx.type || ""] || "")}>
          {TYPE_LABEL[tx.type || ""] || tx.type}
        </span>
      </div>
      <div className="tx-right">
        <div className="tx-meta">{fmtDate(tx.date_reg)}</div>
        <div className="tx-meta">
          {fmtNum(tx.executed ?? tx.shares)} cp
          {tx.perf_1m != null && (
            <span className={tx.perf_1m >= 0 ? " pos" : " neg"}> · {fmtVal(tx.executed ?? tx.shares, tx.p_from)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
