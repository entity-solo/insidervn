"use client";

import Link from "next/link";
import type { Winrate } from "@/lib/types";
import { fmtMoney } from "@/lib/format";

export default function WinrateRow({
  w,
  rank,
  tone,
}: {
  w: Winrate;
  rank: number;
  tone?: "gold" | "silver" | "bronze";
}) {
  const isWin = w.wr >= 50;
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : <span className="wr-rank-num">{rank}</span>;
  return (
    <Link
      href={`/person/${encodeURIComponent(w.person)}`}
      className={"wr-item " + (isWin ? "dir-win" : "dir-lose") + (tone ? ` tone-${tone}` : "")}
    >
      <div className="medal">{medal}</div>
      <div className="tx-main">
        <div className="tx-person">{w.person}</div>
        <div className="tx-company">
          {w.tickers.join(", ")} — {w.wins} thắng / {w.losses} thua
        </div>
      </div>
      <div style={{ textAlign: "right", minWidth: 70 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: isWin ? "var(--buy)" : "var(--sell)" }}>{w.wr}%</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Win Rate</div>
      </div>
      <div style={{ textAlign: "right", minWidth: 90 }}>
        <div style={{ fontWeight: 700, color: w.pnl >= 0 ? "var(--buy)" : "var(--sell)" }}>
          {w.pnl >= 0 ? "+" : ""}
          {w.pnl.toFixed(1)}%
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>KL {fmtMoney(w.total)}</div>
      </div>
    </Link>
  );
}
