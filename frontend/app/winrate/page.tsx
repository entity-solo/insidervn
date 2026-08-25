"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import WinrateRow from "@/components/WinrateRow";
import PageHeader from "@/components/PageHeader";

const FILTERS: [string, string, string][] = [
  ["all", "Đáng tin cậy", "Ưu tiên người có thành tích dài, ổn định — không thưởng số may mắn với vài đầu lột"],
  ["winner", "WR cao nhất", "Win rate thực cao nhất trước (chỉ tính người WR ≥50%)"],
  ["loser", "WR thấp nhất", "Win rate thấp nhất trước — những người mua dở nhất"],
  ["volume", "KL lớn nhất", "Người di chuyển nhiều tiền nhất"],
];

export default function WinratePage() {
  const [filter, setFilter] = useState("all");
  const [nameQ, setNameQ] = useState("");
  const [minTrades, setMinTrades] = useState(false);
  const q = useQuery({
    queryKey: ["winrate", filter],
    queryFn: () => api.winrates(filter),
  });

  const rows = (q.data ?? [])
    .filter((w) => !nameQ.trim() || w.person.toLowerCase().includes(nameQ.trim().toLowerCase()))
    .filter((w) => !minTrades || w.total_trades >= 20);
  const tone = (i: number) => (i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : undefined);

  return (
    <div className="panel">
      <PageHeader
        eyebrow="Bảng vàng"
        title="Xếp hạng insider"
        sub="Chấm điểm dựa trên hiệu suất giá cổ phiếu sau 1 tháng kể từ lần mua của họ."
      />

      <div className="feed-toolbar">
        <div className="filter-group">
          <span className="filter-label">Xếp theo</span>
          <div className="filters">
            {FILTERS.map(([v, l]) => (
              <button key={v} className={"filter-btn" + (filter === v ? " active" : "")} onClick={() => setFilter(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="filters">
          <button
            className={"filter-btn" + (minTrades ? " active" : "")}
            onClick={() => setMinTrades((m) => !m)}
            title="Chỉ hiện insider có từ 20 giao dịch trở lên"
          >
            ≥20 GD
          </button>
        </div>
        <div className="search-box" style={{ maxWidth: 260 }}>
          <span style={{ color: "var(--muted)" }}>🔍</span>
          <input
            placeholder="Tìm trong bảng xếp hạng…"
            value={nameQ}
            onChange={(e) => setNameQ(e.target.value)}
            aria-label="Tìm insider"
          />
        </div>
      </div>

      <div className="signal-count">
        Hiển thị {rows.length} / {q.data?.length ?? 0} insiders
      </div>
      {q.isLoading && (
        <>
          <div className="skeleton" />
          <div className="skeleton" />
        </>
      )}
      {q.isError && (
        <div className="empty-card">
          <div>Không tải được xếp hạng.</div>
          <button className="btn" onClick={() => q.refetch()}>Thử lại</button>
        </div>
      )}
      {!q.isLoading && !q.isError && rows.length === 0 && (
        <div className="empty">Không có insider nào khớp.</div>
      )}
      {rows.map((w, i) => (
        <WinrateRow key={w.person} w={w} rank={i + 1} tone={tone(i)} />
      ))}
    </div>
  );
}
