"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PriceSeries } from "@/lib/types";
import { fmtDate, fmtPrice } from "@/lib/format";

export default function PriceChart({ data }: { data: PriceSeries }) {
  const points = data.dates
    .map((d, i) => ({ date: d, value: data.values[i] }))
    .filter((p) => p.value != null);
  const last = points.length ? points[points.length - 1].value : null;
  const first = points.length ? points[0].value : null;
  const up = last != null && first != null && last >= first;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{data.ticker} — giá tuần (VND)</div>
        {last != null && (
          <div style={{ fontWeight: 800, color: up ? "var(--buy)" : "var(--sell)" }}>{fmtPrice(last)}</div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up ? "var(--buy)" : "var(--sell)"} stopOpacity={0.25} />
              <stop offset="100%" stopColor={up ? "var(--buy)" : "var(--sell)"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 11 }} minTickGap={40} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} width={64} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8 }}
            labelStyle={{ color: "var(--muted)" }}
            labelFormatter={(l) => fmtDate(String(l))}
            formatter={(v) => [fmtPrice(Number(v)), "Giá"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={up ? "var(--buy)" : "var(--sell)"}
            strokeWidth={2}
            fill="url(#priceFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
