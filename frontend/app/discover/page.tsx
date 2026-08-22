"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import ClusterCard from "@/components/ClusterCard";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import WinrateRow from "@/components/WinrateRow";

function SignalBlock({
  icon,
  title,
  desc,
  items,
  isLoading,
  preview = 5,
  renderItem,
}: {
  icon: string;
  title: string;
  desc: string;
  items: any[];
  isLoading: boolean;
  preview?: number;
  renderItem: (item: any, index: number) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, preview);
  const hasMore = items.length > preview;
  return (
    <section className="signal-section">
      <div className="signal-section-title">
        {icon} {title}
      </div>
      <div className="signal-count">{desc}</div>
      {isLoading && <div className="skeleton" />}
      <div className="tx-list">
        {shown.map((it, i) => renderItem(it, i))}
      </div>
      {hasMore && (
        <div style={{ marginTop: 10 }}>
          <button className="filter-btn" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Thu gọn" : `Xem thêm (${items.length - preview})`}
          </button>
        </div>
      )}
    </section>
  );
}

function RallyRow({ tx }: { tx: Transaction }) {
  const r = tx.rally ?? 0;
  return (
    <div className="tx-item sell">
      <div className="tx-ticker">{tx.ticker}</div>
      <div className="tx-main">
        <div className="tx-person">
          {tx.person}
          {tx.person_type === "org" && <span className="tx-org">Tổ chức</span>}
          <span style={{ color: "var(--muted)", fontWeight: 500 }}> · {tx.role}</span>
        </div>
        <div className="tx-company">{tx.company} · {tx.exchange}</div>
      </div>
      <div className="tx-right">
        <div className="tx-meta">{fmtDate(tx.date_reg)}</div>
        <div className="tx-meta">{(tx.executed ?? 0).toLocaleString("vi-VN")} cp</div>
        <div className={"tx-meta " + (r >= 0 ? "pos" : "neg")}>
          {r >= 0 ? "▲ +" : "▼ "}
          {r}%
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [wrFilter, setWrFilter] = useState("all");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const clusterBuy = useQuery({
    queryKey: ["clusters", "buy", 14],
    queryFn: () => api.clusters(14, "all", "buy", 100),
  });
  const clusterSell = useQuery({
    queryKey: ["clusters", "sell", 14],
    queryFn: () => api.clusters(14, "all", "sell", 100),
  });
  const dip = useQuery({ queryKey: ["dip"], queryFn: () => api.dip() });
  const rally = useQuery({ queryKey: ["rally"], queryFn: () => api.rally() });
  const largestBuy = useQuery({ queryKey: ["largest", "buy"], queryFn: () => api.largest("buy") });
  const treasury = useQuery({ queryKey: ["treasury"], queryFn: () => api.treasury() });
  const wr = useQuery({
    queryKey: ["winrate", wrFilter],
    queryFn: () => api.winrates(wrFilter),
  });

  return (
    <div className="panel">
      <div>
        <div className="eyebrow">Khám phá</div>
        <div className="feed-title">Tín hiệu & xếp hạng</div>
      </div>

      <div className="section-label">Tín hiệu</div>

      <SignalBlock
        icon="🔥"
        title="Mua rổ"
        desc="Nhóm từ 2 insider/người liên quan trở lên cùng mua một mã trong 14 ngày"
        items={clusterBuy.data ?? []}
        isLoading={clusterBuy.isLoading}
        renderItem={(c, i) => (
          <ClusterCard key={`${c.ticker}-${c.start}-${i}`} c={c} side="buy" />
        )}
      />

      <SignalBlock
        icon="📉"
        title="Mua khi giảm"
        desc="Lượt mua diễn ra sau khi giá đã giảm ≥5% trước ngày giao dịch"
        items={dip.data ?? []}
        isLoading={dip.isLoading}
        renderItem={(tx) => <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />}
      />

      <SignalBlock
        icon="🔻"
        title="Bán rổ"
        desc="Nhóm từ 2 insider/người liên quan trở lên cùng bán một mã trong 14 ngày"
        items={clusterSell.data ?? []}
        isLoading={clusterSell.isLoading}
        renderItem={(c, i) => (
          <ClusterCard key={`${c.ticker}-${c.start}-${i}`} c={c} side="sell" />
        )}
      />

      <SignalBlock
        icon="📈"
        title="Bán khi tăng"
        desc="Lượt bán diễn ra sau khi giá đã tăng ≥5% (4 tuần trước ngày giao dịch)"
        items={rally.data ?? []}
        isLoading={rally.isLoading}
        renderItem={(tx) => <RallyRow key={tx.id} tx={tx} />}
      />

      <SignalBlock
        icon="💰"
        title="Mua lớn"
        desc="Các lệnh mua có khối lượng thực hiện lớn nhất"
        items={largestBuy.data ?? []}
        isLoading={largestBuy.isLoading}
        renderItem={(tx) => <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />}
      />

      <SignalBlock
        icon="🏦"
        title="Cổ phiếu quỹ"
        desc="Giao dịch công ty mua lại cổ phiếu quỹ"
        items={treasury.data ?? []}
        isLoading={treasury.isLoading}
        renderItem={(tx) => <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />}
      />

      <div className="section-label">Xếp hạng</div>

      <div className="filters" style={{ marginTop: 4 }}>
        {[
          ["all", "Tất cả"],
          ["winner", "Top thắng"],
          ["loser", "Top thua"],
          ["volume", "KL lớn"],
        ].map(([v, l]) => (
          <button key={v} className={"filter-btn" + (wrFilter === v ? " active" : "")} onClick={() => setWrFilter(v)}>
            {l}
          </button>
        ))}
      </div>
      <div className="signal-count">Hiển thị {wr.data?.length ?? 0} insiders (tối đa 200)</div>
      {wr.isLoading && <div className="skeleton" />}
      {wr.data?.map((w, i) => (
        <WinrateRow key={w.person} w={w} rank={i + 1} />
      ))}

      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
