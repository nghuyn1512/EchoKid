"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Tiến trình", icon: "chart" },
  { path: "/children", label: "Chọn bé", icon: "child" },
  { path: "/daily-log", label: "Ghi nhận hằng ngày", icon: "spark" },
  { path: "/expert", label: "Chuyên gia", icon: "doctor" },
];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10.5V20h13v-9.5M9.5 20v-6h5v6" /></>,
    child: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c.5-4.4 2.7-6.5 6.5-6.5s6 2.1 6.5 6.5" /><path d="M8.5 7c1-2.2 2.8-3.2 5.5-2.8" /></>,
    spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
    chart: <><path d="M4 20V9M10 20V4M16 20v-7M22 20H2" /></>,
    doctor: <><circle cx="12" cy="7" r="3.5" /><path d="M5 21v-2.5c0-4 2.5-6.5 7-6.5s7 2.5 7 6.5V21" /><path d="M16.5 14.5v4M14.5 16.5h4" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId");
  const today = new Date().toLocaleDateString("en-CA");
  const { data: session, status } = useSession();

  function getHref(path: string) {
    if (path === "/children" || !childId) return path;
    if (path === "/expert") return `${path}?childId=${childId}&date=${today}`;
    return `${path}?childId=${childId}`;
  }

  return (
    <>
      <aside id="main-sidebar" className={sidebarOpen ? "app-sidebar is-open" : "app-sidebar"} aria-hidden={!sidebarOpen}>
        <Link href={getHref("/dashboard")} className="sidebar-brand" aria-label="EchoKid - Tiến trình">
          <img className="sidebar-logo" src="/echokid-logo.png" alt="EchoKid" />
          <span><strong>EchoKid</strong><small>Hiểu con mỗi ngày</small></span>
        </Link>

        <div className="sidebar-label">Không gian của bạn</div>
        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <Link key={item.path} href={getHref(item.path)} className={pathname === item.path ? "is-active" : ""} onClick={() => setSidebarOpen(false)}>
              <span className="sidebar-nav__icon"><NavIcon name={item.icon} /></span>
              <span>{item.label}</span>
              {pathname === item.path && <i />}
            </Link>
          ))}
        </nav>

        <div className="sidebar-tip">
          <span>✦</span>
          <strong>Một ghi nhận nhỏ</strong>
          <p>cũng giúp ba mẹ hiểu con rõ hơn mỗi ngày.</p>
        </div>

      </aside>

      <header className="app-topbar">
        <button
          type="button"
          className={sidebarOpen ? "menu-toggle is-open" : "menu-toggle"}
          aria-label={sidebarOpen ? "Đóng sidebar" : "Mở sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls="main-sidebar"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
        <Link href={getHref("/dashboard")} className="topbar-brand" aria-label="EchoKid - Tiến trình">
          <img src="/echokid-logo.png" alt="EchoKid" />
          <strong>EchoKid</strong>
        </Link>
        <nav className="topbar-nav" aria-label="Điều hướng nhanh">
          <Link href={getHref("/dashboard")} className={pathname === "/dashboard" ? "is-active" : ""}>
            <NavIcon name="chart" /><span>Tiến trình</span>
          </Link>
          {status === "authenticated" && session?.user ? (
            <div className="account-menu">
              <button
                type="button"
                className="account-trigger"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name ?? "Tài khoản"} />
                ) : (
                  <i>{session.user.name?.slice(0, 1).toUpperCase() ?? "U"}</i>
                )}
                <span>{session.user.name ?? "Tài khoản"}</span>
                <svg viewBox="0 0 24 24" className="account-chevron"><path d="m8 10 4 4 4-4" /></svg>
              </button>
              {accountOpen && (
                <div className="account-dropdown">
                  <div>
                    <strong>{session.user.name ?? "Tài khoản"}</strong>
                    <small>{session.user.email ?? "Phụ huynh EchoKid"}</small>
                  </div>
                  <button type="button" onClick={() => signOut({ callbackUrl: "/" })}>
                    <svg viewBox="0 0 24 24"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </nav>
      </header>

      {sidebarOpen && <button type="button" className="sidebar-overlay" aria-label="Đóng sidebar" onClick={() => setSidebarOpen(false)} />}

      <nav className="mobile-nav" aria-label="Điều hướng mobile">
        {navItems.map((item) => (
          <Link key={item.path} href={getHref(item.path)} className={pathname === item.path ? "is-active" : ""}>
            <NavIcon name={item.icon} />
            <small>{item.label}</small>
          </Link>
        ))}
      </nav>
    </>
  );
}
