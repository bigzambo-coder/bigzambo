import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘코치 | 개인 다이어트 체크인",
  description: "회원가입 없이 쓰는 위고비·마운자로 다이어트 체크인과 코치 체험",
  icons: { icon: "/coach-icon.svg", apple: "/coach-icon.svg" },
  appleWebApp: { capable: true, title: "오늘코치" },
};

export const viewport: Viewport = { themeColor: "#eef3ee", viewportFit: "cover" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
