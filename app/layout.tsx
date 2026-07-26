// app/layout.tsx
import "./globals.css";
import Providers from "@/components/provider";
import Navbar from "@/components/navbar";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EchoKid",
  description: "Đồng hành cùng ba mẹ để hiểu con mỗi ngày",
  icons: {
    icon: "/echokid-logo.png",
    shortcut: "/echokid-logo.png",
    apple: "/echokid-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <Suspense fallback={<div className="sidebar-fallback" aria-hidden="true" />}>
            <Navbar />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
