import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { assertChildOwnership, getObservations } from "@/services/firestore.service";

const moodLabel: Record<string, string> = {
  happy: "Vui vẻ", calm: "Bình tĩnh", irritable: "Cáu gắt",
  anxious: "Lo âu", withdrawn: "Thu mình",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "Thiếu childId" }, { status: 400 });

  try {
    const child = await assertChildOwnership(childId, session.user.id);
    const observations = await getObservations(childId, 30);
    const recent = observations.slice(-20);
    const counts = recent.reduce<Record<string, number>>((acc, item) => {
      acc[item.mood] = (acc[item.mood] ?? 0) + 1;
      return acc;
    }, {});
    const dominantMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const sleepAverage = recent.length
      ? recent.reduce((sum, item) => sum + (item.sleep?.hours ?? 0), 0) / recent.length
      : 0;
    const lines = [
      "TÓM TẮT THEO DÕI ECHOKID",
      `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`, "",
      `Bé: ${child.name}`, `Tuổi: ${child.ageMonths} tháng`,
      `Số lần ghi nhận trong 30 ngày: ${observations.length}`,
      `Tâm trạng thường gặp: ${moodLabel[dominantMood] ?? "Chưa đủ dữ liệu"}`,
      `Thời lượng ngủ trung bình: ${sleepAverage.toFixed(1)} giờ`, "",
      "CÁC GHI NHẬN GẦN NHẤT",
      ...recent.slice().reverse().map((item) =>
        `- ${item.date} ${item.time}: ${moodLabel[item.mood] ?? item.mood}; ngủ ${item.sleep?.hours ?? 0}h; tương tác ${item.socialInteraction}; tập trung ${item.focus}${item.freeTextNote ? `; ghi chú: ${item.freeTextNote}` : ""}`
      ), "",
      "Lưu ý: Tài liệu do phụ huynh ghi nhận, chỉ hỗ trợ trao đổi và không thay thế chẩn đoán y khoa.",
    ];
    return new NextResponse(`\uFEFF${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="EchoKid-${child.name.replace(/\s+/g, "-")}.txt"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Không thể xuất báo cáo" }, { status: 500 });
  }
}
