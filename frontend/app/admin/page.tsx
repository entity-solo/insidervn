"use client";

import { useState, useEffect, useCallback } from "react";

const API = "";

interface Dashboard {
  pipeline: { last_crawl_at: string | null; last_crawl_ok: boolean };
  data: {
    total_transactions: number;
    by_type: Record<string, number>;
    price_tickers: number;
    winrate_insiders: number;
    perf_coverage: number;
  };
  system: { db_latency_ms: number; memory_used_pct?: number; memory_used_gb?: number; memory_total_gb?: number };
  api: {
    total_requests: number;
    error_count: number;
    error_rate: number;
    uptime_s: number;
    endpoints: { path: string; count: number; avg_ms: number; p95_ms: number }[];
  };
  traffic: {
    enabled: boolean;
    total_30d?: { visitors?: number; pageviews?: number };
    total_7d?: { visitors?: number; pageviews?: number };
    daily?: { timestamp: string; visitors: number; pageviews: number }[];
    top_pages?: { route: string; visitors: number; pageviews: number }[];
    top_referrers?: { referrerHostname: string; visitors: number; pageviews: number }[];
    top_countries?: { country: string; visitors: number; pageviews: number }[];
  };
}

function Stat({ label, value, sub, ok }: { label: string; value: string | number; sub?: string; ok?: boolean }) {
  return (
    <div className="dash-stat">
      <div className="dash-stat-label">{label}</div>
      <div className={"dash-stat-value" + (ok === false ? " neg" : ok === true ? " pos" : "")}>{value}</div>
      {sub && <div className="dash-stat-sub">{sub}</div>}
    </div>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày ${h % 24}h trước`;
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((s % 3600) / 60)}m`;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      setAuthed(true);
    }
  }, []);

  const fetch_ = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        if (r.status === 401) {
          sessionStorage.removeItem("admin_token");
          setAuthed(false);
          setErr("Token sai hoặc hết hạn");
          return;
        }
        throw new Error(`${r.status}`);
      }
      setData(await r.json());
      setErr("");
    } catch (e: any) {
      setErr(e.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authed) return;
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => clearInterval(iv);
  }, [authed, fetch_]);

  if (!authed) {
    return (
      <main className="container" style={{ paddingTop: 40, maxWidth: 400 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Admin Dashboard</h1>
        <input
          type="password"
          placeholder="Admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && token.trim()) {
              sessionStorage.setItem("admin_token", token.trim());
              setAuthed(true);
            }
          }}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: "1px solid var(--border)", background: "var(--surface-2)",
            color: "var(--text)", marginBottom: 10,
          }}
        />
        {err && <div style={{ color: "var(--sell)", fontSize: 13 }}>{err}</div>}
        <button
          className="btn btn-accent"
          style={{ width: "100%" }}
          disabled={!token.trim()}
          onClick={() => {
            sessionStorage.setItem("admin_token", token.trim());
            setAuthed(true);
          }}
        >
          Đăng nhập
        </button>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="container" style={{ paddingTop: 40 }}>
        <div style={{ color: "var(--muted)" }}>{loading ? "Đang tải..." : err || "Không có dữ liệu"}</div>
      </main>
    );
  }

  const p = data.pipeline;
  const d = data.data;
  const s = data.system;
  const a = data.api;

  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Dashboard</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Tự refresh 30s</span>
          <button className="btn" style={{ fontSize: 12, padding: "4px 10px" }} onClick={fetch_}>
            Refresh
          </button>
          <button
            className="btn"
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => {
              sessionStorage.removeItem("admin_token");
              setAuthed(false);
              setToken("");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {err && <div style={{ color: "var(--sell)", fontSize: 13, marginBottom: 12 }}>{err}</div>}

      {/* Pipeline */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Pipeline
        </h2>
        <div className="dash-grid">
          <Stat
            label="Lần crawl cuối"
            value={timeAgo(p.last_crawl_at)}
            sub={p.last_crawl_at ? new Date(p.last_crawl_at).toLocaleString("vi-VN") : "—"}
            ok={p.last_crawl_ok}
          />
          <Stat label="Trạng thái" value={p.last_crawl_ok ? "Thành công" : "Thất bại"} ok={p.last_crawl_ok} />
          <Stat label="Uptime" value={formatUptime(a.uptime_s)} />
        </div>
      </section>

      {/* Data */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Dữ liệu
        </h2>
        <div className="dash-grid">
          <Stat label="Tổng giao dịch" value={d.total_transactions.toLocaleString()} />
          <Stat label="Mua" value={d.by_type.buy?.toLocaleString() || "0"} sub="giao dịch" />
          <Stat label="Bán" value={d.by_type.sell?.toLocaleString() || "0"} sub="giao dịch" />
          <Stat label="Giá.coverage" value={`${d.price_tickers} ticker`} />
          <Stat label="Winrate" value={`${d.winrate_insiders} người`} />
          <Stat label="perf_1m coverage" value={`${d.perf_coverage}%`} ok={d.perf_coverage > 80} />
        </div>
      </section>

      {/* API */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          API Performance
        </h2>
        <div className="dash-grid" style={{ marginBottom: 12 }}>
          <Stat label="Tổng requests" value={a.total_requests.toLocaleString()} />
          <Stat label="Lỗi" value={a.error_count} sub={`${a.error_rate}%`} ok={a.error_rate < 5} />
          <Stat label="DB latency" value={`${s.db_latency_ms}ms`} ok={s.db_latency_ms < 200} />
          {s.memory_used_pct !== undefined && (
            <Stat label="Memory" value={`${s.memory_used_pct}%`} sub={`${s.memory_used_gb}/${s.memory_total_gb} GB`} ok={s.memory_used_pct < 85} />
          )}
        </div>
        {a.endpoints.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px" }}>Endpoint</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Requests</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Avg</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>P95</th>
                </tr>
              </thead>
              <tbody>
                {a.endpoints.slice(0, 15).map((ep) => (
                  <tr key={ep.path} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: 12 }}>{ep.path}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>{ep.count.toLocaleString()}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", color: ep.avg_ms > 500 ? "var(--sell)" : "var(--muted)" }}>
                      {ep.avg_ms}ms
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "right", color: ep.p95_ms > 1000 ? "var(--sell)" : "var(--muted)" }}>
                      {ep.p95_ms}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Traffic */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Visitors
        </h2>
        {!data.traffic.enabled ? (
          <div className="dash-stat" style={{ maxWidth: 400 }}>
            <div className="dash-stat-label">Vercel Analytics</div>
            <div className="dash-stat-value" style={{ fontSize: 14 }}>Chưa cấu hình VERCEL_TOKEN</div>
          </div>
        ) : (
          <>
            <div className="dash-grid" style={{ marginBottom: 12 }}>
              <Stat label="Visitors (7 ngày)" value={data.traffic.total_7d?.visitors ?? "—"} />
              <Stat label="Pageviews (7 ngày)" value={data.traffic.total_7d?.pageviews ?? "—"} />
              <Stat label="Visitors (30 ngày)" value={data.traffic.total_30d?.visitors ?? "—"} />
              <Stat label="Pageviews (30 ngày)" value={data.traffic.total_30d?.pageviews ?? "—"} />
            </div>

            {/* Daily trend */}
            {data.traffic.daily && data.traffic.daily.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Xu hướng 14 ngày</div>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 60 }}>
                  {data.traffic.daily.map((d) => {
                    const max = Math.max(...data.traffic.daily!.map((x) => x.visitors), 1);
                    const h = Math.max(2, (d.visitors / max) * 50);
                    return (
                      <div key={d.timestamp} style={{ flex: 1, textAlign: "center" }} title={`${d.timestamp.slice(5)}: ${d.visitors} visitors`}>
                        <div style={{ height: h, background: "var(--accent)", borderRadius: 3, opacity: 0.7 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top pages */}
            {data.traffic.top_pages && data.traffic.top_pages.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Trang phổ biến (30 ngày)</div>
                {data.traffic.top_pages.map((pg) => (
                  <div key={pg.route} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12 }}>{pg.route}</span>
                    <span style={{ color: "var(--muted)" }}>{pg.visitors} visitors · {pg.pageviews} pv</span>
                  </div>
                ))}
              </div>
            )}

            {/* Referrers + Countries */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {data.traffic.top_referrers && data.traffic.top_referrers.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Referrers</div>
                  {data.traffic.top_referrers.map((r) => (
                    <div key={r.referrerHostname} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                      <span>{r.referrerHostname || "(direct)"}</span>
                      <span style={{ color: "var(--muted)" }}>{r.visitors}</span>
                    </div>
                  ))}
                </div>
              )}
              {data.traffic.top_countries && data.traffic.top_countries.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Quốc gia</div>
                  {data.traffic.top_countries.map((c) => (
                    <div key={c.country} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                      <span>{c.country}</span>
                      <span style={{ color: "var(--muted)" }}>{c.visitors}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
