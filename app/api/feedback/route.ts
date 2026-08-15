import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Feedback endpoint chưa được triển khai riêng. Hãy gửi phản hồi qua lần ghi nhận mới." },
    { status: 501 }
  );
}
