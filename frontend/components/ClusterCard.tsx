"use client";

import type { Cluster } from "@/lib/types";
import { fmtDate, fmtNum } from "@/lib/format";

export default function ClusterCard({ c, side = "buy" }: { c: Cluster; side?: "buy" | "sell" }) {
  const isBuy = side === "buy";
  return (
    <div className={`cluster-card ${side}`} style={{ display: "block" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className="tx-ticker" style={{ fontSize: 18 }}>
            {c.ticker}
          </span>{" "}
          {c.company && c.company !== c.ticker && (
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{c.company}</span>
          )}
        </div>
        <span className={"tx-badge " + (isBuy ? "badge-buy" : "badge-sell")}>
          {isBuy ? "Mua rổ" : "Bán rổ"}
        </span>
      </div>
      <div style={{ marginTop: 8 }}>
        {c.persons.slice(0, 8).map((p) => (
          <span key={p} className="chip">
            {p}
          </span>
        ))}
        {c.persons.length > 8 && <span className="chip">+{c.persons.length - 8}</span>}
      </div>
      <div className="cluster-stats">
        <span>{c.start === c.end ? fmtDate(c.start) : `${fmtDate(c.start)} – ${fmtDate(c.end)}`}</span>
        <span className={isBuy ? "pos" : "neg"}>
          {isBuy ? "+" : "−"}
          {fmtNum(c.total_shares)} cp
        </span>
        <span>{c.count} người</span>
      </div>
    </div>
  );
}
