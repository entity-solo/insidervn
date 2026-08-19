export interface Transaction {
  id: number;
  ticker: string | null;
  company: string | null;
  exchange: string | null;
  person: string | null;
  role: string | null;
  role_key: string | null;
  type: string | null;
  shares: number | null;
  executed: number | null;
  p_from: number | null;
  p_to: number | null;
  date_reg: string | null;
  date_from: string | null;
  date_to: string | null;
  source: string | null;
  event_id: number | null;
  status: string | null;
  type_name: string | null;
  relationship: string | null;
  vol_before: number | null;
  vol_after: number | null;
  perf_1w: number | null;
  perf_1m: number | null;
  dip: number | null;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Winrate {
  person: string;
  wr: number;
  wins: number;
  losses: number;
  total_trades: number;
  pnl: number;
  total: number;
  tickers: string[];
}

export interface PriceSeries {
  ticker: string;
  dates: string[];
  values: (number | null)[];
}

export interface Cluster {
  ticker: string;
  company: string | null;
  exchange: string | null;
  count: number;
  persons: string[];
  start: string | null;
  end: string | null;
  total_shares: number;
  total_value: number;
}

export interface Buyer {
  person: string;
  role: string | null;
  count: number;
  value: number;
  tickers: string[];
}

export interface Highlights {
  clusters: Cluster[];
  buys: Transaction[];
  buyers: Buyer[];
}

export interface SearchResult {
  total: number;
  tickers: string[];
  persons: string[];
  items: Transaction[];
}
