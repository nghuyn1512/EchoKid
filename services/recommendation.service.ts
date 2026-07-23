import { getActivityById } from "@/lib/activities"
import { analyzeLog, pickActivity } from "@/services/ai.service";
import {
  getDailyLog,
  getRecentLogs,
  saveRecommendation,
  getRecommendation,
} from "@/services/firestore.service";
import type { Child } from "@/types/child";
import type { RecommendationResult, Severity } from "@/types/recommendation";

const ESCALATION_MESSAGE =
  "Đây là dấu hiệu nên được chuyên gia đánh giá trực tiếp sớm, không nên tự xử lý tại nhà.";

export async function generateRecommendation(
  child: Child,
  childId: string,
  date: string,
  logId: string
): Promise<RecommendationResult> {
  const cached = await getRecommendation(logId);
  if (cached) return cached;
  const todayLog = await getDailyLog(childId, date);
  if (!todayLog) throw new Error("LOG_NOT_FOUND");
  const recentLogs = (await getRecentLogs(childId, 7)).filter((l) => l.date !== date);
  const analysis = await analyzeLog(child, todayLog, recentLogs);
  const picked = await pickActivity(child, todayLog, analysis);
  const activity = getActivityById(picked.activityId)!;

  const severity: Severity = analysis.severity;
  const shouldSuggestExpert = severity === "high";

  const result: Omit<RecommendationResult, "createdAt"> = {
    logId,
    severityLevel: severity,
    empathyMessage: picked.empathyMessage,
    contextSummary: picked.contextSummary,
    recommendation: {
      activityId: activity.id,
      title: activity.title,
      durationMinutes: activity.durationMinutes,
      whyThis: picked.whyThis,
      steps: activity.steps,
    },
    escalation: {
      shouldSuggestExpert,
      message: shouldSuggestExpert ? ESCALATION_MESSAGE : null,
    },
    disclaimer:
      "Đây là gợi ý tham khảo dựa trên các nguyên tắc can thiệp phổ biến, không thay thế chẩn đoán hoặc điều trị y tế.",
  };

  await saveRecommendation(logId, result);
  return { ...result, createdAt: null };
}