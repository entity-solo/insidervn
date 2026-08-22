"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/", "Bảng tin", "📋"],
  ["/discover", "Khám phá", "🧭"],
  ["/stock", "Tra cứu", "🔎"],
  ["/watchlist", "Theo dõi", "⭐"],
];

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
