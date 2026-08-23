import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description:
    "InsiderVN tổng hợp và phân tích giao dịch nội bộ (insider trading) của lãnh đạo, HĐQT, cổ đông lớn trên thị trường chứng khoán Việt Nam.",
};

const SIGNALS: [string, string, string][] = [
  ["🔥 Mua rổ", "Từ 2 insider trở lên cùng mua một mã trong 14 ngày", "Những người hiểu rõ công ty nhất cùng đặt cược — tín hiệu mạnh nhất"],
  ["📉 Mua khi giảm", "Mua sau khi giá đã giảm ≥5% trong 28 ngày", "Người trong cuộc đón đáy khi giá rẻ"],
  ["🔻 Bán rổ", "Từ 2 insider trở lên cùng bán một mã trong 14 ngày", "Cảnh báo đồng loạt rút tiền"],
  ["📈 Bán khi tăng", "Bán sau khi giá đã tăng ≥5% trong 4 tuần", "Chốt lời khi giá cao"],
  ["💰 Mua lớn", "Lệnh mua có khối lượng thực hiện lớn nhất", "Cam kết bằng tiền của chính họ — mức độ tin cao"],
  ["🏦 Cổ phiếu quỹ", "Công ty mua lại cổ phiếu của chính mình", "Doanh nghiệp tin định giá đang thấp"],
];

export default function AboutPage() {
  return (
    <div className="panel">
      <div className="eyebrow">Về InsiderVN</div>
      <div className="feed-title">Đọc vị người trong cuộc</div>
      <p style={{ color: "var(--muted)", maxWidth: 640, lineHeight: 1.7 }}>
        InsiderVN tổng hợp toàn bộ giao dịch nội bộ được công bố trên thị trường chứng khoán Việt Nam
        (HOSE, HNX, UPCoM) — từ Chủ tịch HĐQT, Tổng Giám đốc tới cổ đông lớn và công ty liên quan.
        Mỗi ngày, hệ thống quét nguồn công bố, chuẩn hóa dữ liệu và tính toán các tín hiệu có ý nghĩa
        thống kê, giúp bạn nhìn thấy điều người am hiểu nhất về công ty đang làm với tiền của chính họ.
      </p>

      <div className="section-label">6 tín hiệu chúng tôi theo dõi</div>
      <div className="signal-section">
        {SIGNALS.map(([name, rule, why]) => (
          <div key={name} className="cluster-card" style={{ cursor: "default" }}>
            <div style={{ fontWeight: 700 }}>{name}</div>
            <div className="tx-company" style={{ marginTop: 4 }}>{rule}</div>
            <div className="tx-company" style={{ color: "var(--accent)" }}>{why}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Xếp hạng Win Rate</div>
      <p style={{ color: "var(--muted)", maxWidth: 640, lineHeight: 1.7 }}>
        Mỗi insider được chấm điểm dựa trên hiệu suất giá cổ phiếu sau 1 tháng kể từ lần mua của họ.
        Xem <Link href="/discover" style={{ color: "var(--accent)" }}>bảng xếp hạng</Link> để biết ai
        là những người mua khéo nhất thị trường.
      </p>

      <div className="section-label">Miễn trừ trách nhiệm</div>
      <p style={{ color: "var(--muted)", maxWidth: 640, lineHeight: 1.7 }}>
        Dữ liệu được thu thập từ nguồn công bố công khai và chỉ mang tính tham khảo. Giao dịch của
        insider không đảm bảo diễn biến giá tương lai. Đây không phải là khuyến nghị mua/bán chứng khoán.
      </p>

      <Link href="/" className="btn btn-accent" style={{ display: "inline-block", marginTop: 16 }}>
        Xem bảng tin hôm nay →
      </Link>
    </div>
  );
}
