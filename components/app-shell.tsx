"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/navbar";

const publicRoutes = new Set(["/", "/login"]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const isPublic = publicRoutes.has(pathname);

  useEffect(() => {
    if (!isPublic && status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isPublic, pathname, router, status]);

  if (isPublic) return children;
  if (status !== "authenticated") {
    return <main className="app-auth-loading"><div className="dashboard-skeleton" /><p>Đang kiểm tra phiên đăng nhập...</p></main>;
  }

  return <><Navbar />{children}</>;
}
