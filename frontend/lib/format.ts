export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "K";
  return n.toLocaleString("vi-VN");
}

export function fmtDate(s: string | null): string {
  if (!s) return "—";
  const [y, m, d] = s.split("T")[0].split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

export function fmtPrice(n: number | null): string {
  if (!n) return "—";
  return n.toLocaleString("vi-VN") + "đ";
}

export function fmtMoney(v: number | null): string {
  if (!v) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(1) + " tỷ";
  if (abs >= 1e6) return Math.round(v / 1e6) + " triệu";
  return v.toLocaleString("vi-VN") + "đ";
}

export function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}
