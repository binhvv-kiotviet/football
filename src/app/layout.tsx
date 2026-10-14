import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AdminBanner, GuestNote, RoleNav } from "@/components/role-bar";
import { PlayersLink } from "@/components/players-link";

const font = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chia đội bóng",
  description: "Chia đội bóng đá hàng tuần, lưu lịch sử",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Toàn bộ dữ liệu đọc từ DB lúc request, không cần kiểm tra instant navigation.
export const instant = false;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${font.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-surface">
          <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm sm:gap-4">
            <Link href="/" className="mr-auto text-base font-bold">
              ⚽ FC Vô Danh
            </Link>
            <PlayersLink className="text-muted hover:text-fg">Cầu thủ</PlayersLink>
            <Link href="/history" className="text-muted hover:text-fg">
              Lịch sử
            </Link>
            <Suspense fallback={<span className="w-16" />}>
              <RoleNav />
            </Suspense>
          </nav>
        </header>
        <Suspense>
          <AdminBanner />
        </Suspense>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          <Suspense>
            <GuestNote />
          </Suspense>
          <Suspense fallback={<p className="text-muted">Đang tải…</p>}>{children}</Suspense>
        </main>
      </body>
    </html>
  );
}
