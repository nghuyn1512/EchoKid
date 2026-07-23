import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { assertChildOwnership } from "@/services/firestore.service";
import { generateRecommendation } from "@/services/recommendation.service";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { childId, date } = await req.json();
  if (!childId || !date) {
    return NextResponse.json({ error: "childId và date là bắt buộc" }, { status: 400 });
  }
  try {
    const child = await assertChildOwnership(childId, session.user.id);
    const logId = `${childId}_${date}`;
    const result = await generateRecommendation(child as any, childId, date, logId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (err.message === "LOG_NOT_FOUND") {
      return NextResponse.json(
        { error: "Chưa có log của ngày này, không thể phân tích" },
        { status: 404 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}