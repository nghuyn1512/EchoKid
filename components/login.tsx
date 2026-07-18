"use client";

import { signIn } from "next-auth/react";

export default function GoogleLoginButton() {
  return (
    <button onClick={() => signIn("google")}>
      Đăng nhập bằng Google
    </button>
  );
}