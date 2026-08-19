"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ClusterCard from "@/components/ClusterCard";
import TransactionRow from "@/components/TransactionRow";
import WinrateRow from "@/components/WinrateRow";
import { fmtNum } from "@/lib/format";

type Section = "signal" | "winrate";
type SignalView = "cluster" | "dip" | "highlight";
const EXCHANGES = ["all", "HOSE", "HNX", "UPCoM"];

export default function DiscoverPage() {
  const [section, setSection] = useState<Section>("signal");
  const [view, setView] = useState<SignalView>("cluster");
  const [windowDays, setWindowDays] = useState(14);
  const [exchange, setExchange] = useState("all");
  const [wrFilter, setWrFilter] = useState("all");

  const clusters = useQuery({
    queryKey: ["clusters", windowDays, exchange],
    queryFn: () => api.clusters(windowDays, exchange),
    enabled: section === "signal" && view === "cluster",
  });
  const dip = useQuery({
    queryKey: ["dip", exchange],
    queryFn: () => api.dip(exchange),
    enabled: section === "signal" && view === "dip",
  });
  const highlights = useQuery({
    queryKey: ["highlights", windowDays, exchange],
    queryFn: () => api.highlights(windowDays, exchange),
    enabled: section === "signal" && view === "highlight",
  });
  const wr = useQuery({
    queryKey: ["winrate", wrFilter],
    queryFn: () => api.winrates(wrFilter),
    enabled: section === "winrate",
  });

  return (
    <div className="panel">
      <div>
        <div className="eyebrow">Khám phá</div>
        <div className="feed-title">Tín hiệu & xếp hạng</div>
      </div>

      <div className="feed-controls">
        <div className="filters" style={{ marginRight: 8 }}>
          <button className={"filter-btn" + (section === "signal" ? " active" : "")} onClick={() => setSection("signal")}>
            Phát hiện
          </button>
          <button className={"filter-btn" + (section === "winrate" ? " active" : "")} onClick={() => setSection("winrate")}>
            Xếp hạng
          </button>
        </div>
      </div>

      {section === "signal" && (
        <>
          <div className="feed-controls">
            <div className="filters">
              <button className={"filter-btn" + (view === "cluster" ? " active" : "")} onClick={() => setView("cluster")}>
                Mua rổ
              </button>
              <button className={"filter-btn" + (view === "dip" ? " active" : "")} onClick={() => setView("dip")}>
                Mua khi giảm
              </button>
              <button className={"filter-btn" + (view === "highlight" ? " active" : "")} onClick={() => setView("highlight")}>
                Đáng chú ý
              </button>
            </div>
            <select className="filter-select" value={exchange} onChange={(e) => setExchange(e.target.value)}>
              {EXCHANGES.map((e) => (
                <option key={e} value={e}>
                  {e === "all" ? "Tất cả sàn" : e}
                </option>
              ))}
            </select>
            {view === "cluster" && (
              <div className="filters">
                <button className={"filter-btn" + (windowDays === 14 ? " active" : "")} onClick={() => setWindowDays(14)}>
                  14 ngày
                </button>
                <button className={"filter-btn" + (windowDays === 30 ? " active" : "")} onClick={() => setWindowDays(30)}>
                  30 ngày
                </button>
              </div>
            )}
          </div>

          {view === "cluster" && (
            <>
              <div className="signal-count">{clusters.data?.length ?? 0} nhóm mua rổ ({windowDays} ngày)</div>
              {clusters.data?.map((c) => (
                <ClusterCard key={c.ticker + c.start + c.persons.join()} c={c} />
              ))}
              {clusters.isLoading && <div className="skeleton" />}
            </>
          )}

          {view === "dip" && (
            <>
              <div className="signal-count">{dip.data?.length ?? 0} lượt mua khi giá đang giảm (giảm ≥5% trước ngày mua)</div>
              <div className="tx-list">
                {dip.data?.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} onClick={() => {}} />
                ))}
              </div>
            </>
          )}

          {view === "highlight" && highlights.data && (
            <>
              <div className="signal-section">
                <div className="signal-section-title">🔥 Mua rổ gần đây</div>
                {highlights.data.clusters.slice(0, 5).map((c) => (
                  <ClusterCard key={c.ticker + c.start} c={c} />
                ))}
              </div>
              <div className="signal-section">
                <div className="signal-section-title">💰 Mua ròng lớn nhất</div>
                <div className="tx-list">
                  {highlights.data.buys.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} onClick={() => {}} />
                  ))}
                </div>
              </div>
              <div className="signal-section">
                <div className="signal-section-title">🏆 Top insider mua nhiều nhất</div>
                {highlights.data.buyers.map((b) => (
                  <div key={b.person} className="hl-row">
                    <div className="tx-person">
                      {b.person} <span style={{ color: "var(--muted)" }}>{b.role}</span>
                    </div>
                    <div className="tx-company">
                      {b.count} giao dịch · {b.tickers.slice(0, 5).join(", ")} · <span className="pos">{fmtNum(b.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {section === "winrate" && (
        <>
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
        </>
      )}
    </div>
  );
}
