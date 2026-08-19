import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import CommandPalette from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "InsiderVN — Sổ công bố giao dịch nội bộ",
  description:
    "Theo dõi giao dịch nội bộ của lãnh đạo, HĐQT, cổ đông lớn trên HOSE, HNX, UPCoM. Tín hiệu mua rổ, mua khi giảm và xếp hạng Win Rate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <Navbar />
          <main className="container">{children}</main>
          <BottomNav />
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
