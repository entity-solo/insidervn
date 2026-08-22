import type {
  Cluster,
  PaginatedTransactions,
  PriceSeries,
  SearchResult,
  Transaction,
  Winrate,
} from "./types";

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`/api${path}`, window.location.origin);
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
  winrates: (filter: string, person = "") => get<Winrate[]>("/winrate", { filter, person }),
  clusters: (window: number, exchange = "all", side = "buy", limit = 100) =>
    get<Cluster[]>("/signals/clusters", { window, exchange, side, limit }),
  dip: (exchange = "all") => get<Transaction[]>("/signals/dip", { exchange }),
  largest: (side: "buy" | "sell" = "buy", exchange = "all") =>
    get<Transaction[]>("/signals/largest", { side, exchange }),
  treasury: (exchange = "all") => get<Transaction[]>("/signals/treasury", { exchange }),
  rally: (exchange = "all") => get<Transaction[]>("/signals/rally", { exchange }),
  price: (ticker: string) => get<PriceSeries>(`/prices/${ticker}`),
  meta: () => get<{ last_crawl_at: string | null; last_crawl_ok: string | null }>("/meta"),
  search: (q: string) => get<SearchResult>("/search", { q }),
};
