"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Cluster } from "@/lib/types";
import { api } from "@/lib/api";
import { fmtDate, fmtNum, fmtMoney } from "@/lib/format";

export default function ClusterModal({
  cluster,
  side,
  windowDays = 14,
  onClose,
}: {
  cluster: Cluster;
  side: "buy" | "sell";
  windowDays?: number;
  onClose: () => void;
}) {
  const isBuy = side === "buy";
  const members = useQuery({
    queryKey: ["cluster-members", cluster.ticker, cluster.start, side],
    queryFn: () => api.clusterMembers(cluster.ticker, cluster.persons, cluster.start || "", side, windowDays),
    enabled: !!cluster.ticker && !!cluster.start,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết cụm ${isBuy ? "mua" : "bán"} ${cluster.ticker}`}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="modal-ticker">{cluster.ticker}</div>
            <span className={"tx-badge " + (isBuy ? "badge-buy" : "badge-sell")}>
              {isBuy ? "Mua rổ" : "Bán rổ"}
            </span>
          </div>
          <div className="tx-company">
            {cluster.company && cluster.company !== cluster.ticker ? cluster.company + " · " : ""}
            {cluster.start === cluster.end ? fmtDate(cluster.start) : `${fmtDate(cluster.start)} → ${fmtDate(cluster.end)}`}
          </div>
        </div>

        <div className="kpi-row" style={{ marginTop: 0 }}>
          <div className="kpi-card">
            <div className="kpi-label">Số người</div>
            <div className="kpi-value">{cluster.count}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Tổng khối lượng</div>
            <div className="kpi-value" style={{ color: isBuy ? "var(--buy)" : "var(--sell)" }}>
              {isBuy ? "+" : "−"}
              {fmtNum(cluster.total_shares)} cp
            </div>
          </div>
          {cluster.total_value > 0 && (
            <div className="kpi-card">
              <div className="kpi-label">Giá trị ước tính</div>
              <div className="kpi-value">≈ {fmtMoney(cluster.total_value)}</div>
            </div>
          )}
        </div>

        <div className="modal-k" style={{ margin: "14px 0 6px" }}>Thành viên trong cụm</div>
        {members.isLoading && <div className="skeleton" />}
        <div className="tx-list" style={{ marginTop: 0 }}>
          {(members.data ?? []).map((m) => (
            <div key={m.id} className="tx-item">
              <div className="tx-ticker" style={{ fontSize: 13 }}>{m.person}</div>
              <div className="tx-main">
                <div className="tx-company">{m.role}</div>
              </div>
              <div className="tx-right">
                <div className="tx-meta">{fmtDate(m.date_from || m.date_reg)}</div>
                <div className="tx-meta">{fmtNum((m.executed ?? 0) > 0 ? m.executed! : (m.shares ?? 0))} cp</div>
              </div>
            </div>
          ))}
          {!members.isLoading && (members.data?.length ?? 0) === 0 && (
            <div className="empty">Không tải được danh sách thành viên.</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Link
            href={`/stock/${cluster.ticker}`}
            className="btn btn-accent"
            style={{ flex: 1, textDecoration: "none", display: "inline-flex", justifyContent: "center" }}
            onClick={onClose}
          >
            Xem mã {cluster.ticker} →
          </Link>
          <button className="btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
