import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { assertChildOwnership, getObservation, getObservations, getRecommendation } from "@/services/firestore.service";
import { generateRecommendation, severityFromObservation } from "@/services/recommendation.service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const childId = req.nextUrl.searchParams.get("childId");
  let observationId = req.nextUrl.searchParams.get("observationId");
  if (!childId) {
    return NextResponse.json({ error: "Thiếu mã hồ sơ." }, { status: 400 });
  }

  try {
    await assertChildOwnership(childId, session.user.id);
    if (!observationId) {
      const observations = await getObservations(childId, 365);
      for (const item of observations.slice().reverse()) {
        if (await getRecommendation(item.id)) {
          observationId = item.id;
          break;
        }
      }
    }
    if (!observationId) {
      return NextResponse.json({ error: "Không tìm thấy gợi ý." }, { status: 404 });
    }
    const observation = await getObservation(observationId);
    if (!observation || observation.childId !== childId) {
      return NextResponse.json({ error: "Không tìm thấy gợi ý." }, { status: 404 });
    }
    const recommendation = await getRecommendation(observationId);
    if (!recommendation) {
      return NextResponse.json({ error: "Không tìm thấy gợi ý." }, { status: 404 });
    }
    return NextResponse.json({
      recommendation: {
        ...recommendation,
        severityLevel: severityFromObservation(observation, recommendation.severityLevel),
      },
      observation,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Load recommendation failed:", error);
    return NextResponse.json({ error: "Không thể tải gợi ý." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { childId, observationId } = await req.json();
  if (!childId || !observationId) {
    return NextResponse.json({ error: "Thiếu mã hồ sơ hoặc lần ghi nhận." }, { status: 400 });
  }

  try {
    const child = await assertChildOwnership(childId, session.user.id);
    const result = await generateRecommendation(child, childId, observationId);
    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (code === "OBSERVATION_NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy lần ghi nhận vừa lưu." }, { status: 404 });
    }
    if (code === "AI_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." }, { status: 503 });
    }
    console.error("Gemini analysis failed:", error);
    return NextResponse.json({
      error: "Gemini không thể phân tích dữ liệu lúc này. Dữ liệu đã được lưu; vui lòng thử lại sau.",
      code: "AI_GENERATION_FAILED",
    }, { status: 502 });
  }
}
