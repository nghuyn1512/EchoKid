import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // nếu bạn để authOptions ngay trong route.ts cũ, đổi lại import cho khớp
import {assertChildOwnership, upsertDailyLog, getDailyLog} from "@/services/firestore.service";
import type { DailyLogInput } from "@/types/dailyLog";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as DailyLogInput;
  if (!body.childId || !body.date) {
    return NextResponse.json({ error: "childId và date là bắt buộc" }, { status: 400 });
  }
  try {
    await assertChildOwnership(body.childId, session.user.id);
    await upsertDailyLog(body);
    const saved = await getDailyLog(body.childId, body.date);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (err.message === "LOG_LOCKED") {
      return NextResponse.json(
        { error: "Log của ngày này đã khóa, không thể chỉnh sửa" },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const childId = req.nextUrl.searchParams.get("childId");
  const date = req.nextUrl.searchParams.get("date");
  if (!childId || !date) {
    return NextResponse.json({ error: "childId và date là bắt buộc" }, { status: 400 });
  }
  try {
    await assertChildOwnership(childId, session.user.id);
    const log = await getDailyLog(childId, date);
    return NextResponse.json(log ?? null);
  } catch (err: any) {
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}