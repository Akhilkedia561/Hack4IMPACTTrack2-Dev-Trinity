import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdaptGrid AI — Smart Solar for Odisha",
  description: "Real-time renewable energy optimization for homes & societies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}