import { NextRequest,NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { assertChildOwnership,getLogsInRange } from "@/services/firestore.service";

export async function GET(req: NextRequest){
    const session = await getServerSession(authOptions);
    if(!session?.user.id){
        return NextResponse.json({error: "Unauthorized"},{status: 401});
    }
    const childId = req.nextUrl.searchParams.get("childId");
    const range = req.nextUrl.searchParams.get("range") ?? "week";
    if(!childId){ return NextResponse.json({error: "childId là bắt buộc"},{status: 400});}
    const days = range === "month" ? 30 : 7;
    try {
        await assertChildOwnership(childId,session.user.id);
        const logs = await getLogsInRange(childId,days);
        const dailyBreakdown = logs.map((l)=> ({
            date: l.date,
            mood: l.mood,
            meltdownCount: l.meltdown?.totalCount ?? 0,
            sleepHours: l.sleep?.hours ?? 0,
            socialInteraction: l.socialInteraction,
            focus: l.focus,
            activityCompleted: l.status === "completed",
        }));
        const n = logs.length || 1;
        const summary = {
        logsSubmitted: logs.length,
        meltdownTrend: computeTrend(logs.map((l) => l.meltdown?.totalCount ?? 0)),
        sleepAvgHours: Number(
            (logs.reduce((s, l) => s + (l.sleep?.hours ?? 0), 0) / n).toFixed(1)
        ),
        activitiesCompleted: logs.filter((l) => l.status === "completed").length,
        };

        return NextResponse.json({
        childId,
        range,
        summary,
        dailyBreakdown,
        });
    } catch (err: any) {
        if (err.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        console.error(err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

function computeTrend(values: number[]): "increasing" | "decreasing" | "stable" {
    if (values.length < 4) return "stable";
    const mid = Math.floor(values.length / 2);
    const firstHalfAvg = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalfAvg =
        values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);

    if (secondHalfAvg > firstHalfAvg * 1.15) return "increasing";
    if (secondHalfAvg < firstHalfAvg * 0.85) return "decreasing";
    return "stable";
}