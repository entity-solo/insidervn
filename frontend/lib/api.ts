import type {
  Cluster,
  Highlights,
  PaginatedTransactions,
  PriceSeries,
  SearchResult,
  Transaction,
  Winrate,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE || ""; // relative when using rewrites

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${BASE}/api${path}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== "all") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export interface TxParams {
  page?: number;
  page_size?: number;
  type?: string;
  exchange?: string;
  role?: string;
  period?: string;
  q?: string;
  person?: string;
  ticker?: string;
  sort?: string;
  dir?: string;
}

export const api = {
  transactions: (p: TxParams) => get<PaginatedTransactions>("/transactions", p as any),
  winrates: (filter: string) => get<Winrate[]>("/winrate", { filter }),
  clusters: (window: number, exchange: string) => get<Cluster[]>("/signals/clusters", { window, exchange }),
  dip: (exchange: string) => get<Transaction[]>("/signals/dip", { exchange }),
  highlights: (window: number, exchange: string) =>
    get<Highlights>("/signals/highlights", { window, exchange }),
  price: (ticker: string) => get<PriceSeries>(`/prices/${ticker}`),
  search: (q: string) => get<SearchResult>("/search", { q }),
};
