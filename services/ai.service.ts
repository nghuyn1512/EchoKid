import { Type } from "@google/genai";
import {ai} from "@/lib/gemini";
import type { Child } from "@/types/child";
import type { DailyLog } from "@/types/dailyLog";
import type { AnalysisResult } from "@/types/recommendation";
import { ACTIVITIES } from "@/lib/activities";

export async function analyzeLog(
  child: Child,
  todayLog: DailyLog,
  recentLogs: DailyLog[]
): Promise<AnalysisResult> {
  const prompt = `
Bạn là hệ thống hỗ trợ phân tích hành vi trẻ có nhu cầu phát triển đặc biệt (KHÔNG chẩn đoán y tế).
Trẻ: ${child.ageMonths} tháng tuổi, chẩn đoán/nghi ngờ: ${child.diagnosis?.type?.join(", ") || "chưa rõ"}.
Log hôm nay: ${JSON.stringify(todayLog)}
Log ${recentLogs.length} ngày gần đây: ${JSON.stringify(recentLogs)}
Nhiệm vụ: so sánh hôm nay với xu hướng gần đây, xác định các pattern đáng chú ý (KHÔNG chẩn đoán bệnh),
và mức độ nghiêm trọng cần chú ý (mild/moderate/high).
"high" CHỈ dùng khi có dấu hiệu tự làm đau bản thân, meltdown tăng đột biến bất thường, hoặc an toàn bị đe dọa.
`.trim();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.OBJECT,
        properties: {
          flaggedPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          severity: { type: Type.STRING, enum: ["mild", "moderate", "high"] },
          comparisonToBaseline: { type: Type.STRING },
        },
        required: ["flaggedPatterns", "severity", "comparisonToBaseline"],
      },
    },
  });
  if (!response.text){
    throw new Error("Gemini returned empty response")
  }
  return JSON.parse(response.text) as AnalysisResult;
}

export async function pickActivity(
  child: Child,
  todayLog: DailyLog,
  analysis: AnalysisResult
): Promise<{ activityId: string; whyThis: string; empathyMessage: string; contextSummary: string }> {
  const candidateList = ACTIVITIES.map(({ id, title, targetBehaviors, ageRangeMonths }) => ({
    id, title, targetBehaviors, ageRangeMonths,
  }));

  const prompt = `
Trẻ ${child.ageMonths} tháng tuổi. Log hôm nay: ${JSON.stringify(todayLog)}.
Phân tích: ${JSON.stringify(analysis)}.
Danh sách hoạt động được phép chọn (BẮT BUỘC chọn đúng 1 "id" trong danh sách này, không tự tạo hoạt động mới):
${JSON.stringify(candidateList)}

Trả về: id hoạt động phù hợp nhất, lý do ngắn gọn (whyThis), 1 câu đồng cảm mở đầu (empathyMessage,
không phán xét, không dùng thuật ngữ y khoa), và 1 câu tóm tắt tình huống hôm nay (contextSummary).
`.trim();

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.OBJECT,
        properties: {
          activityId: { type: Type.STRING },
          whyThis: { type: Type.STRING },
          empathyMessage: { type: Type.STRING },
          contextSummary: { type: Type.STRING },
        },
        required: ["activityId", "whyThis", "empathyMessage", "contextSummary"],
      },
    },
  });
  if(!response.text){
    throw new Error("Gemini returned empty response");
  }
  const parsed = JSON.parse(response.text);
  const valid = ACTIVITIES.some((a) => a.id === parsed.activityId);
  return {
    ...parsed,
    activityId: valid ? parsed.activityId : "act_default_calm",
  };
}