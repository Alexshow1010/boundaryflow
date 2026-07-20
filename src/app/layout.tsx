import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoundaryFlow — Cross-Device System Simulator",
  description: "Interactive cross-device boundary protection simulator"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
