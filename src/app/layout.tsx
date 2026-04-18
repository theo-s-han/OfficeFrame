import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Office Tool",
  description: "오피스 문서용 시각화 웹앱 실행 골격",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="app-frame">
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
