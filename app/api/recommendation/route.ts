import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { assertChildOwnership } from "@/services/firestore.service";
import { generateRecommendation } from "@/services/recommendation.service";

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
