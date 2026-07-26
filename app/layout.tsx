// app/layout.tsx
import "./globals.css";
import Providers from "@/components/provider";
import Navbar from "@/components/navbar";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Alfa_Slab_One, Roboto_Slab } from "next/font/google";

const alfaSlab = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-alfa-slab",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto-slab",
});

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
    <html lang="vi" className={`${alfaSlab.variable} ${robotoSlab.variable}`}>
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
