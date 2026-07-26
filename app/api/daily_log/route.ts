import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  assertChildOwnership,
  createObservation,
  getDailyLog,
  getObservations,
  upsertDailyLog,
} from "@/services/firestore.service";
import type { DailyLogInput } from "@/types/dailyLog";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as DailyLogInput;
  if (!body.childId || !body.date) {
    return NextResponse.json({ error: "childId và date là bắt buộc" }, { status: 400 });
  }
  try {
    await assertChildOwnership(body.childId, session.user.id);
    const observationId = await createObservation(body);
    await upsertDailyLog(body);
    const dailyLog = await getDailyLog(body.childId, body.date);
    return NextResponse.json({ dailyLog, observationId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const childId = req.nextUrl.searchParams.get("childId");
  const date = req.nextUrl.searchParams.get("date");
  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  if (!childId) return NextResponse.json({ error: "childId là bắt buộc" }, { status: 400 });

  try {
    await assertChildOwnership(childId, session.user.id);
    if (date) return NextResponse.json(await getDailyLog(childId, date));
    return NextResponse.json({
      observations: await getObservations(childId, Math.min(days, 365)),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
