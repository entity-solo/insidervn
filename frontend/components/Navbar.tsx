"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/", "Bảng tin"],
  ["/discover", "Khám phá"],
  ["/stock", "Tra cứu"],
  ["/watchlist", "Danh mục"],
];

export default function Navbar() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/");

  return (
    <nav className="nav">
      <Link href="/" className="logo">
        <div className="logo-seal">N</div>
        InsiderVN
      </Link>
      <div className="nav-tabs">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className={"nav-tab" + (isActive(href) ? " active" : "")}>
            {label}
          </Link>
        ))}
      </div>
      <div className="nav-right">
        <button
          className="btn cmd-trigger"
          onClick={() => window.dispatchEvent(new Event("open-command"))}
          aria-label="Tìm kiếm (Ctrl K)"
          title="Tìm kiếm (Ctrl K)"
        >
          ⌘K
        </button>
        <button className="btn" onClick={() => alert("Đăng nhập Supabase — tích hợp ở phase sau")}>
          Đăng nhập
        </button>
      </div>
    </nav>
  );
}
