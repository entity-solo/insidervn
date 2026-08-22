import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/" className="logo" style={{ fontSize: 15 }}>
            <div className="logo-seal">N</div>
            InsiderVN
          </Link>
          <Link href="/about" className="tx-company">Giới thiệu</Link>
          <Link href="/discover" className="tx-company">Tín hiệu</Link>
          <span className="tx-company" style={{ marginLeft: "auto" }}>
            Dữ liệu công bố từ Vietstock · Chỉ mang tính tham khảo, không phải khuyến nghị đầu tư
          </span>
        </div>
      </div>
    </footer>
  );
}
