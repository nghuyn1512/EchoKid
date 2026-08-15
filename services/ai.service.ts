import { Type } from "@google/genai";
import { ai } from "@/lib/gemini";
import type { Child } from "@/types/child";
import type { Observation } from "@/types/dailyLog";
import type {
  ActivityReference,
  ActivityReferenceKey,
  Severity,
} from "@/types/recommendation";

const ACTIVITY_REFERENCE_CATALOG: Record<ActivityReferenceKey, ActivityReference> = {
  esdm: {
    key: "esdm",
    title: "Early Start Denver Model",
    organization: "Sally Rogers & Geraldine Dawson",
    note: "Phù hợp các hoạt động tương tác tự nhiên, lượt chơi và giao tiếp sớm.",
  },
  aba: {
    key: "aba",
    title: "Applied Behavior Analysis",
    organization: "Behavior Analyst Certification Board",
    note: "Phù hợp khi cần chia nhỏ bước, tăng cường phản hồi và cụ thể hóa kỳ vọng.",
  },
  sensory_regulation: {
    key: "sensory_regulation",
    title: "Sensory Regulation Strategies",
    organization: "Sensory integration practice",
    note: "Phù hợp khi trẻ có dấu hiệu quá tải kích thích hoặc cần ổn định cảm giác.",
  },
  who_cst: {
    key: "who_cst",
    title: "Caregiver Skills Training",
    organization: "World Health Organization",
    note: "Nhấn mạnh cách cha mẹ hỗ trợ trẻ tại nhà bằng các hoạt động gần với sinh hoạt hằng ngày.",
  },
  aap_co_regulation: {
    key: "aap_co_regulation",
    title: "Co-Regulation And Supportive Routines",
    organization: "American Academy of Pediatrics",
    note: "Phù hợp với hoạt động ngắn, an toàn, giúp người lớn đồng điều hòa cùng trẻ.",
  },
  cdc_play: {
    key: "cdc_play",
    title: "Developmental Play And Routines",
    organization: "CDC",
    note: "Phù hợp với hoạt động chơi đơn giản, rõ ràng, dễ áp dụng tại nhà theo từng độ tuổi.",
  },
};

const ALLOWED_REFERENCE_KEYS = Object.keys(
  ACTIVITY_REFERENCE_CATALOG
) as ActivityReferenceKey[];

type RawAIRecommendation = {
  severityLevel: Severity;
  flaggedPatterns: string[];
  empathyMessage: string;
  contextSummary: string;
  recommendation: {
    title: string;
    durationMinutes: number;
    whyThis: string;
    steps: string[];
    referenceKeys: ActivityReferenceKey[];
  };
  escalation: {
    shouldSuggestExpert: boolean;
    message: string | null;
  };
};

export type AIRecommendation = Omit<RawAIRecommendation, "recommendation"> & {
  recommendation: {
    title: string;
    durationMinutes: number;
    whyThis: string;
    steps: string[];
    references: ActivityReference[];
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
    parentObservationNote: item.freeTextNote || "",
    activityFeedback: item.activityFeedback || "",
  };
}

function isSeverity(value: unknown): value is Severity {
  return value === "mild" || value === "moderate" || value === "high";
}

function isStringArray(value: unknown, minItems = 0): value is string[] {
  return Array.isArray(value) &&
    value.length >= minItems &&
    value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function isReferenceKey(value: unknown): value is ActivityReferenceKey {
  return typeof value === "string" && ALLOWED_REFERENCE_KEYS.includes(value as ActivityReferenceKey);
}

function mapReferences(keys: ActivityReferenceKey[]): ActivityReference[] {
  const deduped = Array.from(new Set(keys)).filter(isReferenceKey);
  const finalKeys: ActivityReferenceKey[] = deduped.length ? deduped : ["who_cst"];
  return finalKeys.map((key) => ACTIVITY_REFERENCE_CATALOG[key]);
}

function parseAIRecommendation(text: string): AIRecommendation {
  const parsed = JSON.parse(text) as RawAIRecommendation;
  if (!isSeverity(parsed.severityLevel)) throw new Error("Invalid severity");
  if (!isStringArray(parsed.flaggedPatterns)) throw new Error("Invalid flagged patterns");
  if (typeof parsed.empathyMessage !== "string" || !parsed.empathyMessage.trim()) {
    throw new Error("Invalid empathy message");
  }
  if (typeof parsed.contextSummary !== "string" || !parsed.contextSummary.trim()) {
    throw new Error("Invalid context summary");
  }
  if (
    !parsed.recommendation ||
    typeof parsed.recommendation.title !== "string" ||
    !parsed.recommendation.title.trim() ||
    !Number.isInteger(parsed.recommendation.durationMinutes) ||
    parsed.recommendation.durationMinutes < 5 ||
    parsed.recommendation.durationMinutes > 30 ||
    typeof parsed.recommendation.whyThis !== "string" ||
    !parsed.recommendation.whyThis.trim() ||
    !isStringArray(parsed.recommendation.steps, 3) ||
    !Array.isArray(parsed.recommendation.referenceKeys) ||
    parsed.recommendation.referenceKeys.length < 1 ||
    parsed.recommendation.referenceKeys.length > 3 ||
    !parsed.recommendation.referenceKeys.every(isReferenceKey)
  ) {
    throw new Error("Invalid recommendation");
  }
  if (
    !parsed.escalation ||
    typeof parsed.escalation.shouldSuggestExpert !== "boolean" ||
    (parsed.escalation.message !== null && typeof parsed.escalation.message !== "string")
  ) {
    throw new Error("Invalid escalation");
  }

  return {
    ...parsed,
    recommendation: {
      title: parsed.recommendation.title.trim(),
      durationMinutes: parsed.recommendation.durationMinutes,
      whyThis: parsed.recommendation.whyThis.trim(),
      steps: parsed.recommendation.steps.map((step) => step.trim()),
      references: mapReferences(parsed.recommendation.referenceKeys),
    },
  };
}

export async function generateAIRecommendation(
  child: Child,
  current: Observation,
  recent: Observation[]
): Promise<AIRecommendation> {
  if (!process.env.GEMINI_API_KEY) throw new Error("AI_NOT_CONFIGURED");

  const referenceOptions = ALLOWED_REFERENCE_KEYS.map((key) => {
    const item = ACTIVITY_REFERENCE_CATALOG[key];
    return `- ${item.key}: ${item.title} (${item.organization}) - ${item.note}`;
  }).join("\n");

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

LƯU Ý VỀ FEEDBACK CỦA PHỤ HUYNH:
- "parentObservationNote" là ghi chú quan sát chung ở thời điểm hiện tại.
- "activityFeedback" là phản hồi sau khi phụ huynh đã thử một hoạt động/gợi ý trước đó.
- Nếu có activityFeedback trong lần hiện tại hoặc lịch sử gần đây, hãy ưu tiên đọc kỹ để điều chỉnh hoạt động mới, tránh lặp lại cách làm đã không phù hợp.

CHỈ ĐƯỢC TRÍCH NGUỒN TỪ DANH SÁCH SAU BẰNG referenceKeys:
${referenceOptions}

Hãy thực hiện:
1. Phân tích RIÊNG lần ghi nhận vừa xảy ra và so sánh với lịch sử nếu đủ dữ liệu.
2. Nêu ngắn gọn những pattern thực sự có căn cứ trong dữ liệu. Không bịa thêm triệu chứng hoặc hoàn cảnh.
3. Tạo MỘT hoạt động cụ thể, an toàn, dễ thực hiện tại nhà ngay lúc này, phù hợp tuổi và dữ liệu vừa nhập.
4. Ở whyThis, giải thích rõ vì sao hoạt động này phù hợp với lần ghi nhận hiện tại và feedback của phụ huynh (nếu có), viết 1-2 câu ngắn, cụ thể theo dữ liệu.
5. Các bước phải đủ cụ thể để phụ huynh làm theo, từ 3 đến 5 bước. Không sao chép mẫu cố định.
6. Chọn 1-3 referenceKeys phù hợp nhất từ danh sách được phép để làm nguồn tham khảo cho hoạt động. Không tự bịa tên nguồn ngoài danh sách.
7. Chỉ đặt severityLevel="high" khi dữ liệu thể hiện nguy cơ an toàn, tự gây thương tích, hoặc mất kiểm soát tăng mạnh. Nếu dữ liệu không đủ thì chọn "mild".
8. Viết hoàn toàn bằng tiếng Việt, giọng ấm áp, không phán xét.
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
              referenceKeys: {
                type: Type.ARRAY,
                minItems: 1,
                maxItems: 3,
                items: { type: Type.STRING, enum: ALLOWED_REFERENCE_KEYS },
              },
            },
            required: ["title", "durationMinutes", "whyThis", "steps", "referenceKeys"],
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
    return parseAIRecommendation(response.text);
  } catch {
    throw new Error("AI_INVALID_RESPONSE");
  }
}
