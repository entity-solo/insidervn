export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "K";
  return n.toLocaleString("vi-VN");
}

export function fmtVal(shares: number | null, price: number | null): string | null {
  if (!shares || !price) return null;
  const v = shares * price;
  if (v >= 1e9) return (v / 1e9).toFixed(1) + " tỷ";
  if (v >= 1e6) return (v / 1e6).toFixed(0) + " triệu";
  return v.toLocaleString("vi-VN") + "đ";
}

export function fmtDate(s: string | null): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtPrice(n: number | null): string {
  if (!n) return "—";
  return n.toLocaleString("vi-VN") + "đ";
}

export function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}
