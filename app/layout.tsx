import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "案件マッチング",
  description: "営業人材向け案件マッチングシステム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
