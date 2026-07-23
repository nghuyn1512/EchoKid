import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  assertChildOwnership,
  getDailyLog,
  getRecentLogs,
  getRecommendation,
} from "@/services/firestore.service";

function computeStreak(dates: string[]): number {
  const sorted = [...dates].sort().reverse(); // mới nhất trước
  let streak = 0;
  let cursor = new Date();
  for (const d of sorted) {
    const expected = cursor.toISOString().slice(0, 10);
    if (d === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "childId là bắt buộc" }, { status: 400 });
  }
  try {
    await assertChildOwnership(childId, session.user.id);
    const today = new Date().toISOString().slice(0, 10);
    const todayLog = await getDailyLog(childId, today);
    const recentLogs = await getRecentLogs(childId, 7);
    const streak = computeStreak(recentLogs.map((l) => l.date));
    const lastLogWithRec = recentLogs.find((l) => l.status === "completed");
    const lastRecommendation = lastLogWithRec
      ? await getRecommendation(lastLogWithRec.id)
      : null;

    const meltdownAvg =
      recentLogs.reduce((sum, l) => sum + (l.meltdown?.totalCount ?? 0), 0) /
      (recentLogs.length || 1);
    const sleepAvg =
      recentLogs.reduce((sum, l) => sum + (l.sleep?.hours ?? 0), 0) /
      (recentLogs.length || 1);

    return NextResponse.json({
      todayLogSubmitted: !!todayLog && todayLog.status === "completed",
      streakDays: streak,
      lastRecommendation: lastRecommendation
        ? {
            activityTitle: lastRecommendation.recommendation.title,
            date: lastLogWithRec!.date,
          }
        : null,
      quickStats7d: {
        meltdownAvg: Number(meltdownAvg.toFixed(1)),
        sleepAvgHours: Number(sleepAvg.toFixed(1)),
      },
    });
  } catch (err: any) {
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}