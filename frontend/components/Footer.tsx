import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-row">
          <Link href="/" className="logo">
            <div className="logo-seal">N</div>
            InsiderVN
          </Link>
          <nav className="footer-links">
            <Link href="/about">Giới thiệu</Link>
            <Link href="/signals">Tín hiệu</Link>
            <Link href="/winrate">Xếp hạng</Link>
          </nav>
          <span className="footer-note">
            Dữ liệu công bố từ Vietstock · Chỉ mang tính tham khảo, không phải khuyến nghị đầu tư
          </span>
        </div>
      </div>
    </footer>
  );
}
