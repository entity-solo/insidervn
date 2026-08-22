"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
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

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="panel">
      <div>
        <div className="feed-title">Giao dịch nội bộ</div>
        <div className="feed-subtitle">Theo dõi giao dịch mua/bán cổ phiếu của lãnh đạo, HĐQT & cổ đông lớn — cập nhật từ công bố chính thức.</div>
      </div>

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
      </div>

      {!isLoading && !isError && items.length === 0 && (
        <div className="empty-card">
          <div>Không có giao dịch nào khớp với bộ lọc hiện tại.</div>
          <button className="btn" onClick={() => { setType("all"); setRole("all"); }}>
            Xóa bộ lọc
          </button>
        </div>
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
