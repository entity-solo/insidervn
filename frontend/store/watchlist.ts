"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistState {
  tickers: string[];
  persons: string[];
  addTicker: (t: string) => void;
  removeTicker: (t: string) => void;
  addPerson: (p: string) => void;
  removePerson: (p: string) => void;
  setAll: (tickers: string[], persons: string[]) => void;
}

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set) => ({
      tickers: [],
      persons: [],
      addTicker: (t) =>
        set((s) => {
          const v = t.trim().toUpperCase();
          return s.tickers.includes(v) ? s : { tickers: [...s.tickers, v] };
        }),
      removeTicker: (t) => set((s) => ({ tickers: s.tickers.filter((x) => x !== t) })),
      addPerson: (p) =>
        set((s) => {
          const v = p.trim();
          return s.persons.includes(v) ? s : { persons: [...s.persons, v] };
        }),
      removePerson: (p) => set((s) => ({ persons: s.persons.filter((x) => x !== p) })),
      setAll: (tickers, persons) => set({ tickers, persons }),
    }),
    { name: "insidervn-watchlist" }
  )
);
