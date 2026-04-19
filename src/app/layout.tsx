import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataViz Studio",
  description: "업무 데이터를 문서형 시각화 이미지로 정리하는 웹앱",
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
