"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PriceSeries } from "@/lib/types";

export default function PriceChart({ data }: { data: PriceSeries }) {
  const points = data.dates
    .map((d, i) => ({ date: d, value: data.values[i] }))
    .filter((p) => p.value != null);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{data.ticker} — giá tuần (VND)</div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 11 }} minTickGap={40} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} width={64} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8 }}
            labelStyle={{ color: "var(--muted)" }}
          />
          <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
