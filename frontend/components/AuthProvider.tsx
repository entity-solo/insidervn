"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useWatchlist } from "@/store/watchlist";

interface AuthCtx {
  session: Session | null;
  ready: boolean;
  signIn: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  ready: false,
  signIn: async () => ({}),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(Ctx);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const store = useWatchlist();
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSynced = useRef<string>("");

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const remoteKey = (t: string[], p: string[]) => `${t.join(",")}|${p.join(",")}`;

  // On login: merge remote watchlist into local, then push merged state up.
  useEffect(() => {
    if (!supabase || !session?.user) return;
    const uid = session.user.id;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_watchlists")
        .select("tickers, persons")
        .eq("user_id", uid)
        .maybeSingle();
      if (cancelled || !data) {
        if (!cancelled) lastSynced.current = remoteKey(store.tickers, store.persons);
        return;
      }
      const remoteT: string[] = data.tickers ?? [];
      const remoteP: string[] = data.persons ?? [];
      const mergedT = [...new Set([...remoteT, ...store.tickers])];
      const mergedP = [...new Set([...remoteP, ...store.persons])];
      store.setAll(mergedT, mergedP);
      lastSynced.current = remoteKey(mergedT, mergedP);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Push local changes (debounced) while logged in.
  useEffect(() => {
    if (!supabase || !session?.user) return;
    const key = remoteKey(store.tickers, store.persons);
    if (key === lastSynced.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      lastSynced.current = key;
      await supabase.from("user_watchlists").upsert({
        user_id: session.user.id,
        tickers: store.tickers,
        persons: store.persons,
        updated_at: new Date().toISOString(),
      });
    }, 1000);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.tickers, store.persons, session?.user?.id]);

  const signIn = useCallback(
    async (email: string) => {
      if (!supabase) return { error: "Chưa cấu hình Supabase" };
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
      });
      if (error) return { error: error.message };
      return {};
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  }, [supabase]);

  return <Ctx.Provider value={{ session, ready, signIn, signOut }}>{children}</Ctx.Provider>;
}
