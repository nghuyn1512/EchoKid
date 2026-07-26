import { Type } from "@google/genai";
import { ai } from "@/lib/gemini";
import type { Child } from "@/types/child";
import type { Observation } from "@/types/dailyLog";
import type { Severity } from "@/types/recommendation";

export type AIRecommendation = {
  severityLevel: Severity;
  flaggedPatterns: string[];
  empathyMessage: string;
  contextSummary: string;
  recommendation: {
    title: string;
    durationMinutes: number;
    whyThis: string;
    steps: string[];
  };
  escalation: {
    shouldSuggestExpert: boolean;
    message: string | null;
  };
};

function compactObservation(item: Observation) {
  return {
    observedAt: item.observedAt,
    mood: item.mood,
    sleep: item.sleep,
    meal: item.meal,
    meltdown: item.meltdown,
    socialInteraction: item.socialInteraction,
    focus: item.focus,
    parentNote: item.freeTextNote || "",
  };
}

export async function generateAIRecommendation(
  child: Child,
  current: Observation,
  recent: Observation[]
): Promise<AIRecommendation> {
  if (!process.env.GEMINI_API_KEY) throw new Error("AI_NOT_CONFIGURED");

  const prompt = `
Bạn là trợ lý AI hỗ trợ phụ huynh quan sát hành vi và cảm xúc của trẻ. Bạn KHÔNG chẩn đoán bệnh và KHÔNG thay thế bác sĩ.

HỒ SƠ TRẺ:
- Tuổi: ${child.ageMonths} tháng
- Giới tính: ${child.gender}
- Tình trạng đã biết: ${child.diagnosis?.type?.join(", ") || "Chưa có thông tin"}
- Mục tiêu gia đình: ${child.goals?.join(", ") || "Chưa ghi nhận"}

LẦN GHI NHẬN VỪA XẢY RA (đây là dữ liệu quan trọng nhất):
${JSON.stringify(compactObservation(current), null, 2)}

CÁC LẦN GHI NHẬN TRƯỚC ĐÓ ĐỂ SO SÁNH (cũ đến mới):
${JSON.stringify(recent.slice(-20).map(compactObservation), null, 2)}

Hãy thực hiện:
1. Phân tích RIÊNG lần ghi nhận vừa xảy ra và so sánh với lịch sử nếu đủ dữ liệu.
2. Nêu ngắn gọn những pattern thực sự có căn cứ trong dữ liệu. Không bịa thêm triệu chứng hoặc hoàn cảnh.
3. Tạo MỘT hoạt động cụ thể, an toàn, dễ thực hiện tại nhà ngay lúc này, phù hợp tuổi và dữ liệu vừa nhập.
4. Các bước phải đủ cụ thể để phụ huynh làm theo, từ 3 đến 5 bước. Không sao chép mẫu cố định.
5. Chỉ đặt severityLevel="high" khi dữ liệu thể hiện nguy cơ an toàn, tự gây thương tích, hoặc mất kiểm soát tăng mạnh. Nếu dữ liệu không đủ thì chọn "mild".
6. Viết hoàn toàn bằng tiếng Việt, giọng ấm áp, không phán xét.
`.trim();

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      temperature: 0.35,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          severityLevel: { type: Type.STRING, enum: ["mild", "moderate", "high"] },
          flaggedPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          empathyMessage: { type: Type.STRING },
          contextSummary: { type: Type.STRING },
          recommendation: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              durationMinutes: { type: Type.INTEGER, minimum: 5, maximum: 30 },
              whyThis: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                minItems: 3,
                maxItems: 5,
                items: { type: Type.STRING },
              },
            },
            required: ["title", "durationMinutes", "whyThis", "steps"],
          },
          escalation: {
            type: Type.OBJECT,
            properties: {
              shouldSuggestExpert: { type: Type.BOOLEAN },
              message: { type: Type.STRING, nullable: true },
            },
            required: ["shouldSuggestExpert", "message"],
          },
        },
        required: [
          "severityLevel", "flaggedPatterns", "empathyMessage",
          "contextSummary", "recommendation", "escalation",
        ],
      },
    },
  });

  if (!response.text) throw new Error("AI_EMPTY_RESPONSE");
  try {
    const result = JSON.parse(response.text) as AIRecommendation;
    if (!result.recommendation?.steps?.length || !result.contextSummary) {
      throw new Error("Invalid AI response");
    }
    return result;
  } catch {
    throw new Error("AI_INVALID_RESPONSE");
  }
}
