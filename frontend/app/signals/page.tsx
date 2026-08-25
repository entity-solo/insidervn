"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import ClusterCard from "@/components/ClusterCard";
import ClusterModal from "@/components/ClusterModal";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import PageHeader from "@/components/PageHeader";

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { rootMargin: "400px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);
  return { ref, inView };
}

function BlockShell({
  icon, title, desc, count, isLoading, isError, refetch, items, preview = 5, renderItem, extra,
}: {
  icon: string; title: string; desc: string; count?: number;
  isLoading: boolean; isError: boolean; refetch: () => void;
  items: any[]; preview?: number;
  renderItem: (item: any, index: number) => ReactNode;
  extra?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, preview);
  const hasMore = items.length > preview;
  return (
    <section className="signal-section">
      <div className="signal-section-title">
        {icon} {title}
        {count != null && <span className="block-count">{count.toLocaleString("vi-VN")}</span>}
      </div>
      <div className="signal-count" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span>{desc}</span>
        {extra}
      </div>
      {isLoading ? (
        <>
          <div className="skeleton" />
          <div className="skeleton" />
        </>
      ) : isError ? (
        <div className="empty-card">
          <div>Không tải được khu này.</div>
          <button className="btn" onClick={() => refetch()}>Thử lại</button>
        </div>
      ) : (
        <>
          <div className="tx-list">{shown.map((it, i) => renderItem(it, i))}</div>
          {hasMore && (
            <div style={{ marginTop: 10 }}>
              <button className="filter-btn" onClick={() => setExpanded((e) => !e)}>
                {expanded ? "Thu gọn" : `Xem thêm (${items.length - preview})`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ClusterBlock({ id, icon, title, side, desc, window: winDays }: { id: string; icon: string; title: string; side: "buy" | "sell"; desc: string; window: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const q = useQuery({
    queryKey: ["clusters", side, winDays],
    queryFn: () => api.clusters(winDays, "all", side, 100),
    enabled: inView,
  });
  const [selected, setSelected] = useState<any>(null);
  return (
    <div ref={ref} id={id}>
      <BlockShell
        icon={icon} title={title} desc={desc}
        count={q.data?.length} isLoading={q.isLoading} isError={q.isError}
        refetch={() => q.refetch()} items={q.data ?? []}
        renderItem={(c, i) => (
          <div
            key={`${c.ticker}-${c.start}-${i}`}
            onClick={() => setSelected(c)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(c)}
          >
            <ClusterCard c={c} side={side} />
          </div>
        )}
      />
      {selected && (
        <ClusterModal cluster={selected} side={side} windowDays={winDays} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function TxBlock({
  id, icon, title, desc, queryKey, queryFn, render, extra,
}: {
  id: string; icon: string; title: string; desc: string;
  queryKey: any[]; queryFn: () => Promise<Transaction[]>;
  render: (tx: Transaction, select: (t: Transaction) => void) => ReactNode;
  extra?: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const q = useQuery({ queryKey, queryFn, enabled: inView });
  const [selected, setSelected] = useState<Transaction | null>(null);
  return (
    <div ref={ref} id={id}>
      <BlockShell
        icon={icon} title={title} desc={desc}
        count={q.data?.length} isLoading={q.isLoading} isError={q.isError}
        refetch={() => q.refetch()} items={q.data ?? []}
        renderItem={(tx) => render(tx, setSelected)}
        extra={extra}
      />
      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const JUMPS: [string, string][] = [
  ["🔥 Mua rổ", "mua-ro"],
  ["📉 Mua khi giảm", "mua-khi-giam"],
  ["🔻 Bán rổ", "ban-ro"],
  ["📈 Bán khi tăng", "ban-khi-tang"],
  ["💰 Mua lớn", "mua-lon"],
  ["🏦 Cổ phiếu quỹ", "co-phieu-quy"],
];

export default function SignalsPage() {
  const [winDays, setWinDays] = useState(14);
  return (
    <div className="panel">
      <PageHeader
        eyebrow="Tín hiệu"
        title="Tín hiệu giao dịch"
        sub="Sáu mẫu hình giao dịch nội bộ có ý nghĩa thống kê, cập nhật theo nguồn công bố."
      />

      <div className="feed-toolbar" style={{ marginTop: 12 }}>
        <div className="filters">
          {JUMPS.map(([label, id]) => (
            <button key={id} className="filter-btn" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              {label}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span className="filter-label">Cửa sổ cụm</span>
          <div className="filters">
            {[14, 30].map((d) => (
              <button key={d} className={"filter-btn" + (winDays === d ? " active" : "")} onClick={() => setWinDays(d)}>
                {d} ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      <ClusterBlock
        id="mua-ro" icon="🔥" title="Mua rổ" side="buy" window={winDays}
        desc={`Nhóm từ 2 insider/người liên quan trở lên cùng mua một mã trong ${winDays} ngày`}
      />

      <TxBlock
        id="mua-khi-giam" icon="📉" title="Mua khi giảm"
        desc="Lượt mua diễn ra sau khi giá đã giảm ≥5% trước ngày giao dịch"
        queryKey={["dip"]} queryFn={() => api.dip()}
        render={(tx, select) => <TransactionRow key={tx.id} tx={tx} onClick={() => select(tx)} />}
      />

      <ClusterBlock
        id="ban-ro" icon="🔻" title="Bán rổ" side="sell" window={winDays}
        desc={`Nhóm từ 2 insider/người liên quan trở lên cùng bán một mã trong ${winDays} ngày`}
      />

      <TxBlock
        id="ban-khi-tang" icon="📈" title="Bán khi tăng"
        desc="Lượt bán diễn ra sau khi giá đã tăng ≥5% (4 tuần trước ngày giao dịch)"
        queryKey={["rally"]} queryFn={() => api.rally()}
        render={(tx, select) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            onClick={() => select(tx)}
            extra={tx.rally != null ? { value: `▲ +${tx.rally}%`, tone: "pos" } : undefined}
          />
        )}
      />

      <TxBlock
        id="mua-lon" icon="💰" title="Mua lớn"
        desc="Lệnh mua khối lượng lớn nhất trong 1 năm qua"
        queryKey={["largest", "buy", 365]} queryFn={() => api.largest("buy", "all", 365)}
        render={(tx, select) => <TransactionRow key={tx.id} tx={tx} onClick={() => select(tx)} />}
      />

      <TxBlock
        id="co-phieu-quy" icon="🏦" title="Cổ phiếu quỹ"
        desc="Giao dịch công ty mua lại cổ phiếu quỹ"
        queryKey={["treasury"]} queryFn={() => api.treasury()}
        render={(tx, select) => <TransactionRow key={tx.id} tx={tx} onClick={() => select(tx)} />}
      />
    </div>
  );
}
