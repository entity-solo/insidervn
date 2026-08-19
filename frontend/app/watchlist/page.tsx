"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useWatchlist } from "@/store/watchlist";
import TransactionRow from "@/components/TransactionRow";
import { fmtNum } from "@/lib/format";

export default function WatchlistPage() {
  const { tickers, persons, addTicker, removeTicker, addPerson, removePerson } = useWatchlist();
  const [tickerInput, setTickerInput] = useState("");
  const [personInput, setPersonInput] = useState("");

  const { data: trades, isLoading } = useQuery({
    queryKey: ["wl-trades", tickers, persons],
    queryFn: async () => {
      const queries = [...tickers, ...persons].map((q) => api.search(q).then((r) => r.items));
      const lists = await Promise.all(queries);
      const map = new Map<number, any>();
      lists.flat().forEach((t) => map.set(t.id, t));
      return [...map.values()].sort((a, b) => (b.date_reg || "").localeCompare(a.date_reg || "")).slice(0, 60);
    },
    enabled: tickers.length + persons.length > 0,
  });

  return (
    <div className="panel">
      <div>
        <div className="eyebrow">Danh mục cá nhân</div>
        <div className="feed-title">Theo dõi</div>
        <div className="feed-subtitle">Theo dõi lãnh đạo và mã CP bạn quan tâm</div>
      </div>

      <div className="wl-stats">
        <div className="wl-stat-card">
          <div>
            <div className="wl-stat-value">{persons.length}</div>
            <div className="wl-stat-label">Người</div>
          </div>
        </div>
        <div className="wl-stat-card">
          <div>
            <div className="wl-stat-value">{tickers.length}</div>
            <div className="wl-stat-label">Mã CP</div>
          </div>
        </div>
        <div className="wl-stat-card">
          <div>
            <div className="wl-stat-value">{trades?.length ?? 0}</div>
            <div className="wl-stat-label">Giao dịch</div>
          </div>
        </div>
        <div className="wl-stat-card">
          <div>
            <div className="wl-stat-value" style={{ color: "var(--accent)" }}>
              Live
            </div>
            <div className="wl-stat-label">Nguồn</div>
          </div>
        </div>
      </div>

      <div className="wl-add">
        <div className="wl-add-group">
          <input
            className="wl-input uppercase"
            placeholder="Thêm mã: VIC, FPT…"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tickerInput.trim()) {
                addTicker(tickerInput);
                setTickerInput("");
              }
            }}
          />
          <button
            className="btn btn-accent"
            onClick={() => {
              if (tickerInput.trim()) {
                addTicker(tickerInput);
                setTickerInput("");
              }
            }}
          >
            + Mã CP
          </button>
        </div>
        <div className="wl-add-group">
          <input
            className="wl-input"
            placeholder="Thêm người: Đoàn Nguyên Đức…"
            value={personInput}
            onChange={(e) => setPersonInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && personInput.trim()) {
                addPerson(personInput);
                setPersonInput("");
              }
            }}
          />
          <button
            className="btn btn-accent"
            onClick={() => {
              if (personInput.trim()) {
                addPerson(personInput);
                setPersonInput("");
              }
            }}
          >
            + Người
          </button>
        </div>
      </div>

      <div className="signal-section">
        <div className="signal-section-title">Mã CP đang theo dõi</div>
        {tickers.length === 0 && <div className="tx-company">Chưa có</div>}
        <div>
          {tickers.map((t) => (
            <span key={t} className="chip" style={{ cursor: "pointer" }} onClick={() => removeTicker(t)} title="Xoá">
              {t} ✕
            </span>
          ))}
        </div>
      </div>
      <div className="signal-section">
        <div className="signal-section-title">Lãnh đạo đang theo dõi</div>
        {persons.length === 0 && <div className="tx-company">Chưa có</div>}
        <div>
          {persons.map((p) => (
            <span key={p} className="chip" style={{ cursor: "pointer" }} onClick={() => removePerson(p)} title="Xoá">
              {p} ✕
            </span>
          ))}
        </div>
      </div>

      <div className="signal-section">
        <div className="signal-section-title">Giao dịch gần đây</div>
        {isLoading && <div className="skeleton" />}
        <div className="tx-list">
          {(trades ?? []).map((tx) => (
            <TransactionRow key={tx.id} tx={tx} onClick={() => {}} />
          ))}
          {!isLoading && (trades?.length ?? 0) === 0 && <div className="empty">Chưa có giao dịch</div>}
        </div>
      </div>
    </div>
  );
}
