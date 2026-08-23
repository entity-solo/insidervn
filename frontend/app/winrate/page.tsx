"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import WinrateRow from "@/components/WinrateRow";

const FILTERS = [
  ["all", "Tất cả"],
  ["winner", "Top thắng"],
  ["loser", "Top thua"],
  ["volume", "KL lớn"],
];

export default function WinratePage() {
  const [filter, setFilter] = useState("all");
  const q = useQuery({
    queryKey: ["winrate", filter],
    queryFn: () => api.winrates(filter),
  });

  return (
    <div className="panel">
      <div className="feed-head">
        <div>
          <div className="eyebrow">Bảng vàng</div>
          <div className="feed-title">Xếp hạng insider</div>
          <div className="feed-subtitle">
            Chấm điểm dựa trên hiệu suất giá cổ phiếu sau 1 tháng kể từ lần mua của họ.
          </div>
        </div>
      </div>

      <div className="feed-toolbar">
        <div className="filters">
          {FILTERS.map(([v, l]) => (
            <button key={v} className={"filter-btn" + (filter === v ? " active" : "")} onClick={() => setFilter(v)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="signal-count">Hiển thị {q.data?.length ?? 0} insiders (tối đa 200)</div>
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
      {q.data?.map((w, i) => (
        <WinrateRow key={w.person} w={w} rank={i + 1} />
      ))}
    </div>
  );
}
