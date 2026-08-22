"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CmdItem {
  label: string;
  sub?: string;
  href: string;
  icon: string;
}

const NAV: CmdItem[] = [
  { label: "Bảng tin", href: "/", icon: "📋" },
  { label: "Khám phá", href: "/discover", icon: "🧭" },
  { label: "Tra cứu", href: "/stock", icon: "🔎" },
  { label: "Theo dõi", href: "/watchlist", icon: "⭐" },
  { label: "Giới thiệu", href: "/about", icon: "💡" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useQuery({
    queryKey: ["cmd", q],
    queryFn: () => api.search(q),
    enabled: open && q.trim().length > 0,
  });

  const items = useMemo<CmdItem[]>(() => {
    const out: CmdItem[] = [...NAV];
    if (q.trim() && search.data) {
      for (const t of search.data.tickers.slice(0, 6))
        out.push({ label: t, sub: "Mã", href: `/stock/${t}`, icon: "🏷️" });
      for (const p of search.data.persons.slice(0, 6))
        out.push({ label: p, sub: "Insider", href: `/person/${encodeURIComponent(p)}`, icon: "👤" });
    }
    return out;
  }, [q, search.data]);

  useEffect(() => setActive(0), [q, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQ("");
  }, [open]);

  if (!open) return null;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) go(it.href);
    }
  };

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-row">
          <span style={{ color: "var(--muted)" }}>⌘K</span>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Tìm mã, insider hoặc chuyển tab…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            aria-label="Command palette"
          />
          <span className="cmd-kbd">Esc</span>
        </div>
        <div className="cmd-list">
          {items.map((it, i) => (
            <div
              key={it.href + it.label}
              className={"cmd-item" + (i === active ? " active" : "")}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(it.href)}
            >
              <span className="cmd-icon">{it.icon}</span>
              <span className="cmd-label">{it.label}</span>
              {it.sub && <span className="cmd-sub">{it.sub}</span>}
            </div>
          ))}
          {q.trim() && !search.isLoading && search.data && items.length === NAV.length && (
            <div className="cmd-empty">Không tìm thấy kết quả cho “{q}”.</div>
          )}
        </div>
        <div className="cmd-footer">
          <span><span className="cmd-kbd">↑</span><span className="cmd-kbd">↓</span> di chuyển</span>
          <span><span className="cmd-kbd">Enter</span> mở</span>
          <span><span className="cmd-kbd">Esc</span> đóng</span>
        </div>
      </div>
    </div>
  );
}
