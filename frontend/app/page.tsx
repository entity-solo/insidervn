"use client";

import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TxParams } from "@/lib/api";
import type { Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";
import TransactionModal from "@/components/TransactionModal";

const TYPES = [
  ["all", "Tất cả"],
  ["buy", "Đã mua"],
  ["sell", "Đã bán"],
  ["register", "Đăng ký"],
];
const ROLES = [
  ["all", "Tất cả"],
  ["board", "HĐQT"],
  ["insider", "Người nội bộ"],
  ["shareholder", "Cổ đông lớn"],
  ["related", "Người liên quan"],
  ["treasury", "Cổ phiếu quỹ"],
  ["internal", "CĐ nội bộ"],
];

export default function FeedPage() {
  const [type, setType] = useState("all");
  const [role, setRole] = useState("all");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const params: TxParams = { type, role, dir: "desc", page_size: 60 };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ["tx", params],
    queryFn: ({ pageParam = 1 }) => api.transactions({ ...params, page: pageParam }),
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    initialPageParam: 1,
  });
  const metaInfo = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.meta(),
    staleTime: 5 * 60_000,
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const fmtD = (s: string | null) => (s ? s.split("T")[0].split("-").reverse().join("/") : "—");
  const txDate = (t: Transaction) => t.date_from || t.date_reg || "";

  // Ngày dữ liệu mới nhất THỰC TẾ (bỏ qua các đăng ký có ngày tương lai).
  const today = new Date().toISOString().slice(0, 10);
  let latest: string | null = null;
  for (const t of items) {
    const d = txDate(t);
    if (d && d <= today && (!latest || d > latest)) latest = d;
  }

  // Hoạt động 14 ngày gần nhất (nằm trọn trong trang đầu của feed).
  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const recent = items.filter((t) => txDate(t) >= cutoff);
  const buys = recent.filter((t) => (t.type || "").includes("buy"));
  const sells = recent.filter((t) => (t.type || "").includes("sell"));
  const volOf = (t: Transaction) => (t.executed ?? 0) > 0 ? t.executed! : (t.shares ?? 0);
  const netVol = buys.reduce((a, t) => a + volOf(t), 0) - sells.reduce((a, t) => a + volOf(t), 0);
  const fmtShort = (n: number) =>
    n >= 1e6 ? (n / 1e6).toFixed(1).replace(".0", "") + "tr"
    : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n);

  return (
    <div className="panel">
      <div className="feed-head">
        <div>
          <div className="feed-title">Giao dịch nội bộ</div>
          <div className="feed-subtitle">Theo dõi giao dịch mua/bán cổ phiếu của lãnh đạo, HĐQT & cổ đông lớn — cập nhật từ công bố chính thức.</div>
        </div>
        {latest && (
          <div className="feed-updated" title="Ngày hệ thống quét nguồn lần cuối và ngày giao dịch mới nhất">
            <span className={"feed-updated-dot" + (metaInfo.data?.last_crawl_ok === "0" ? " err" : "")} />
            Quét {metaInfo.data?.last_crawl_at
              ? new Date(metaInfo.data.last_crawl_at).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
              : "—"}{metaInfo.data?.last_crawl_ok === "1" ? "" : " (lỗi)"} · Dữ liệu đến {fmtD(latest)}
          </div>
        )}
      </div>

      {!isLoading && recent.length > 0 && (
        <div className="feed-stats">
          <div className="dash-hero">
            <div className="dash-seg">
              <div className="dash-hero-num">{recent.length}</div>
              <div className="dash-hero-sub">GD trong 14 ngày qua</div>
            </div>
            <div className="dash-seg">
              <div className="dash-hero-num pos">{buys.length}</div>
              <div className="dash-hero-sub">lượt mua</div>
            </div>
            <div className="dash-seg">
              <div className="dash-hero-num neg">{sells.length}</div>
              <div className="dash-hero-sub">lượt bán</div>
            </div>
            <div className="dash-seg">
              <div className={"dash-hero-num " + (netVol >= 0 ? "pos" : "neg")}>
                {netVol >= 0 ? "+" : "−"}{fmtShort(Math.abs(netVol))}
              </div>
              <div className="dash-hero-sub">KL ròng (cp)</div>
            </div>
          </div>
        </div>
      )}

      <div className="feed-toolbar">
        <div className="feed-filters">
          <div className="filter-group">
            <span className="filter-label">Loại</span>
            <div className="filters">
              {TYPES.map(([v, l]) => (
                <button key={v} className={"filter-btn" + (type === v ? " active" : "")} onClick={() => setType(v)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">Vai trò</span>
            <div className="filters">
              {ROLES.map(([v, l]) => (
                <button key={v} className={"filter-btn" + (role === v ? " active" : "")} onClick={() => setRole(v)}>
                  {l}
                </button>
              ))}
            </div>
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
        {isFetchingNextPage && <div className="skeleton" />}
      </div>

      {!isLoading && !isError && items.length === 0 && (
        <div className="empty-card">
          <div>Không có giao dịch nào khớp với bộ lọc hiện tại.</div>
          <button className="btn" onClick={() => { setType("all"); setRole("all"); }}>
            Xóa bộ lọc
          </button>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="tx-count">Đang hiển thị {items.length} / {data?.pages[0]?.total.toLocaleString("vi-VN")} giao dịch</div>
      )}

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
