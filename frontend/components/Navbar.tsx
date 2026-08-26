"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import LogoIcon from "./LogoIcon";

const ALL_TABS = [
  ["/", "Bảng tin"],
  ["/signals", "Tín hiệu"],
  ["/winrate", "Xếp hạng"],
  ["/stock", "Tra cứu"],
  ["/watchlist", "Theo dõi"],
];
const TABS = ALL_TABS.filter(([href]) => href !== "/watchlist" || FEATURES.watchlist);

export default function Navbar() {
  const path = usePathname();
  const { session, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/");

  const submit = async () => {
    setErr("");
    const res = await signIn(email.trim());
    if (res.error) setErr(res.error);
    else setSent(true);
  };

  return (
    <nav className="nav">
      <Link href="/" className="logo">
        <LogoIcon size={30} />
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
        {FEATURES.auth && session?.user ? (
          <>
            <span className="tx-company" style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
              {session.user.email}
            </span>
            <button className="btn" onClick={() => signOut()}>
              Thoát
            </button>
          </>
        ) : FEATURES.auth ? (
          <button className="btn" onClick={() => setOpen(true)}>
            Đăng nhập
          </button>
        ) : null}
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Đăng nhập"
          >
            <div className="modal-header">
              <div className="modal-ticker">Đăng nhập</div>
              <div className="tx-company">Dùng email để đồng bộ danh sách theo dõi</div>
            </div>
            {sent ? (
              <p style={{ margin: "14px 0" }}>
                ✉️ Đã gửi link đăng nhập tới <b>{email}</b>. Mở email và bấm vào link để hoàn tất.
              </p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="email@vidu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && email.trim() && submit()}
                  aria-label="Email đăng nhập"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    marginBottom: 10,
                  }}
                />
                {err && (
                  <div className="tx-company neg" style={{ marginBottom: 8 }}>
                    {err}
                  </div>
                )}
                <button className="btn btn-accent" style={{ width: "100%" }} disabled={!email.trim()} onClick={submit}>
                  Gửi link đăng nhập
                </button>
              </>
            )}
            <button className="btn" style={{ marginTop: 8, width: "100%" }} onClick={() => setOpen(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
