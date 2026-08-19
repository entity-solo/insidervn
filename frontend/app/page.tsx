"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TxParams } from "@/lib/api";
import type { Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";
import { fmtNum } from "@/lib/format";

const TYPES = [
  ["all", "Tất cả"],
  ["buy", "Đã mua"],
  ["sell", "Đã bán"],
  ["register", "Đăng ký"],
  ["HOSE", "HOSE"],
  ["HNX", "HNX"],
  ["UPCoM", "UPCoM"],
];
const ROLES = [
  ["all", "Tất cả"],
  ["board", "HĐQT"],
  ["insider", "Người nội bộ"],
  ["related", "Người liên quan"],
];
const PERIODS = [
  ["all", "Tất cả"],
  ["7", "7 ngày"],
  ["30", "30 ngày"],
  ["90", "3 tháng"],
  ["180", "6 tháng"],
  ["365", "1 năm"],
  ["2026", "2026"],
  ["2025", "2025"],
  ["2024", "2024"],
  ["2023", "2023"],
  ["2022", "2022"],
  ["2021", "2021"],
  ["2020", "2020"],
];
const SORTS = [
  ["date", "Ngày"],
  ["value", "Giá trị"],
  ["shares", "KL"],
  ["perf1w", "1T"],
  ["perf1m", "1Th"],
  ["ticker", "Mã"],
];

export default function FeedPage() {
  const [type, setType] = useState("all");
  const [role, setRole] = useState("all");
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params: TxParams = { type, role, period, sort, dir, q: debounced, page_size: 60 };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ["tx", params],
    queryFn: ({ pageParam = 1 }) => api.transactions({ ...params, page: pageParam }),
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    initialPageParam: 1,
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div className="panel">
      <div>
        <div className="eyebrow">Sổ công bố nội bộ</div>
        <div className="feed-title">Giao dịch insider</div>
        <div className="feed-subtitle">Tổng hợp từ HOSE · HNX · UPCoM — giai đoạn 2020–2026</div>
      </div>

      <div className="feed-controls">
        <div className="search-box">
          <span style={{ color: "var(--muted)" }}>🔍</span>
          <input
            placeholder="Tìm mã, tên người…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Tìm kiếm giao dịch"
          />
        </div>
        <button className="btn" onClick={() => setDir(dir === "desc" ? "asc" : "desc")}>
          Sắp: {SORTS.find((s) => s[0] === sort)?.[1]} {dir === "desc" ? "↓" : "↑"}
        </button>
      </div>

      <div className="filters">
        {TYPES.map(([v, l]) => (
          <button key={v} className={"filter-btn" + (type === v ? " active" : "")} onClick={() => setType(v)}>
            {l}
          </button>
        ))}
      </div>
      <div className="filters" style={{ marginTop: 8 }}>
        {ROLES.map(([v, l]) => (
          <button key={v} className={"filter-btn" + (role === v ? " active" : "")} onClick={() => setRole(v)}>
            {l}
          </button>
        ))}
        <select className="filter-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              Sắp theo: {l}
            </option>
          ))}
        </select>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Tổng giao dịch</div>
          <div className="kpi-value">{isLoading ? "…" : fmtNum(total)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Đã hiển thị</div>
          <div className="kpi-value">{fmtNum(items.length)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Bộ lọc</div>
          <div className="kpi-value" style={{ fontSize: 16 }}>
            {[type, role, period].filter((x) => x !== "all").join(" · ") || "Tất cả"}
          </div>
        </div>
      </div>

      {isError && <div className="empty">Lỗi tải dữ liệu.</div>}
      {isLoading && (
        <>
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </>
      )}

      <div className="tx-list">
        {items.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} onClick={() => setSelected(tx)} />
        ))}
      </div>

      {hasNextPage && (
        <div className="loading-more">
          <button className="btn" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Đang tải…" : "Xem thêm ↓"}
          </button>
        </div>
      )}

      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
