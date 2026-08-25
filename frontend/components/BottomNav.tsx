"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/features";

const TABS = [
  ["/", "Bảng tin", "📋"],
  ["/signals", "Tín hiệu", "🧭"],
  ["/winrate", "Xếp hạng", "🏆"],
  ["/stock", "Tra cứu", "🔎"],
].filter(([href]) => href !== "/watchlist" || FEATURES.watchlist);

export default function BottomNav() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/");

  return (
    <nav className="bottom-nav">
      {TABS.map(([href, label, icon]) => (
        <Link key={href} href={href} className={"bottom-tab" + (isActive(href) ? " active" : "")}>
          <span className="bottom-tab-icon">{icon}</span>
          <span className="bottom-tab-label">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
