"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#FFE6BC_0%,_#ffffff_35%)] text-slate-900 px-5 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-[32px] bg-white/80 p-8 shadow-[0_30px_80px_rgba(70,180,51,0.12)] backdrop-blur-xl">
        <div className="space-y-4 text-center">
          <span className="inline-flex rounded-full bg-[#41C8C1]/20 px-4 py-2 text-sm font-semibold text-[#11706d]">
            EchoKid - Hỗ trợ phụ huynh trẻ tự kỷ
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Chào mừng đến với EchoKid
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-8 text-slate-600">
            Ứng dụng theo dõi hành vi và AI gợi ý hoạt động ngắn cho bé. Đăng nhập để bắt đầu ghi nhận và kết nối chuyên gia ngay trong app.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <button
            onClick={() => signIn("google")}
            className="rounded-3xl bg-[#46B433] px-6 py-4 text-base font-semibold text-white shadow-[0_16px_40px_rgba(70,180,51,0.24)] transition hover:-translate-y-0.5"
          >
            Đăng nhập bằng Google
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-6 py-4 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Về trang chủ
          </Link>
        </div>

        <div className="rounded-[28px] border border-[#F9BDBC]/60 bg-[#F9BDBC]/10 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Tính năng chính</h2>
          <ul className="mt-4 grid gap-3 text-slate-700 sm:grid-cols-2">
            <li className="rounded-3xl bg-white/90 p-4 shadow-sm">Ghi nhận hành vi nhanh chỉ bằng icon.</li>
            <li className="rounded-3xl bg-white/90 p-4 shadow-sm">AI phân tích thay đổi bất thường trong ngày.</li>
            <li className="rounded-3xl bg-white/90 p-4 shadow-sm">Gợi ý hoạt động 10-15 phút kèm lý do.</li>
            <li className="rounded-3xl bg-white/90 p-4 shadow-sm">Dashboard theo dõi tiến trình 7 ngày.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
