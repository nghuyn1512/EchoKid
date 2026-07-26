import { NextResponse } from "next/server";
import expertData from "@/data/expert.json";

export async function GET() {
  return NextResponse.json(expertData);
}

export async function POST(request: Request) {
  const { childId, date, note, expertId } = await request.json();
  if (!childId || !date || !expertId) {
    return NextResponse.json({ error: "Thiếu thông tin yêu cầu chuyên gia." }, { status: 400 });
  }
  const expert = expertData.find((item) => item.id === expertId);
  if (!expert) {
    return NextResponse.json({ error: "Chuyên gia không hợp lệ." }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    message: `Yêu cầu đã gửi đến ${expert.name}. Chuyên gia sẽ liên hệ sớm nhất.`,
    booking: { childId, date, note, expert },
  });
}
