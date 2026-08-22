import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import CommandPalette from "@/components/CommandPalette";
import Footer from "@/components/Footer";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://insidervn.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "InsiderVN — Sổ công bố giao dịch nội bộ",
    template: "%s · InsiderVN",
  },
  description:
    "Theo dõi giao dịch nội bộ của lãnh đạo, HĐQT, cổ đông lớn trên HOSE, HNX, UPCoM. Tín hiệu mua rổ, mua khi giảm, bán khi tăng và xếp hạng Win Rate insider.",
  keywords: [
    "giao dịch nội bộ",
    "insider trading việt nam",
    "cổ đông lớn",
    "mua rổ",
    "cổ phiếu quỹ",
    "HOSE",
    "HNX",
    "UPCoM",
  ],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "InsiderVN",
    title: "InsiderVN — Sổ công bố giao dịch nội bộ",
    description:
      "Tín hiệu mua/bán của lãnh đạo doanh nghiệp: mua rổ, mua khi giảm, bán khi tăng, cổ phiếu quỹ và xếp hạng Win Rate.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InsiderVN — Sổ công bố giao dịch nội bộ",
    description:
      "Tín hiệu mua/bán của lãnh đạo doanh nghiệp và xếp hạng Win Rate insider trên HOSE, HNX, UPCoM.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <Navbar />
          <main className="container">{children}</main>
          <Footer />
          <BottomNav />
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
