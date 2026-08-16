import { generateAIRecommendation } from "@/services/ai.service";
import {
  getObservation,
  getObservations,
  getRecommendation,
  saveRecommendation,
} from "@/services/firestore.service";
import type { Child } from "@/types/child";
import type { RecommendationResult } from "@/types/recommendation";
import type { Observation } from "@/types/dailyLog";

type RiskPattern = { high: boolean; reasons: string[] };

function moodBand(mood: Observation["mood"]): "positive" | "low" {
  return mood === "happy" || mood === "calm" ? "positive" : "low";
}

export function assessRiskPatterns(current: Observation, recent: Observation[]): RiskPattern {
  const history = [...recent, current].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  const sameDay = history.filter((item) => item.date === current.date);
  const moodChanges = sameDay.slice(1).reduce((count, item, index) => (
    moodBand(item.mood) !== moodBand(sameDay[index].mood) ? count + 1 : count
  ), 0);
  const volatileInOneDay = sameDay.length >= 4 && moodChanges >= 3;
  const lastThree = history.slice(-3);
  const sustainedLow = lastThree.length === 3 && lastThree.every((item) => (
    moodBand(item.mood) === "low" || item.socialInteraction === "low" ||
    item.focus === "low" || (item.meltdown?.totalCount ?? 0) > 0
  ));

  const reasons: string[] = [];
  if (volatileInOneDay) reasons.push("Cảm xúc thay đổi liên tục giữa tích cực và khó khăn trong cùng một ngày.");
  if (sustainedLow) reasons.push("Ba lần ghi nhận gần nhất liên tục có dấu hiệu ở mức thấp hoặc cần hỗ trợ.");
  return { high: reasons.length > 0, reasons };
}

function highRiskMessage(reasons: string[]) {
  const context = reasons.length ? ` ${reasons.join(" ")}` : "";
  return `EchoKid nhận thấy một pattern cần được quan tâm.${context} Ba mẹ nên đặt lịch trao đổi với bác sĩ hoặc chuyên gia để được đánh giá kỹ hơn.`;
}

export function severityFromObservation(
  observation: Observation,
  aiSeverity: RecommendationResult["severityLevel"]
): RecommendationResult["severityLevel"] {
  const meltdownCount = observation.meltdown?.totalCount ?? 0;
  const needsSupport =
    ["irritable", "anxious", "withdrawn"].includes(observation.mood) ||
    meltdownCount > 0 ||
    observation.sleep?.quality === "poor" ||
    observation.socialInteraction === "low" ||
    observation.focus === "low";

  if (aiSeverity === "high") return "high";
  if (aiSeverity === "moderate" || needsSupport) return "moderate";
  return "mild";
}

export async function generateRecommendation(
  child: Child,
  childId: string,
  observationId: string
): Promise<RecommendationResult> {
  const current = await getObservation(observationId);
  if (!current || current.childId !== childId) throw new Error("OBSERVATION_NOT_FOUND");
  const recent = (await getObservations(childId, 30))
    .filter((item) => item.id !== observationId && item.observedAt < current.observedAt);
  const risk = assessRiskPatterns(current, recent);
  const cached = await getRecommendation(observationId);
  if (cached) {
  const severityLevel = risk.high ? "high" : severityFromObservation(current, cached.severityLevel);
  return {
    ...cached,
    severityLevel,
    recommendation: {
      ...cached.recommendation,
      references: cached.recommendation.references ?? [],
    },
    escalation: severityLevel === "high"
      ? { shouldSuggestExpert: true, message: cached.escalation.message || highRiskMessage(risk.reasons) }
      : cached.escalation,
  };
}
  const generated = await generateAIRecommendation(child, current, recent);
  const severityLevel = risk.high ? "high" : severityFromObservation(current, generated.severityLevel);

  const result: Omit<RecommendationResult, "createdAt"> = {
    logId: observationId,
    severityLevel,
    empathyMessage: generated.empathyMessage,
    contextSummary: generated.contextSummary,
    recommendation: {
      activityId: `ai-${observationId}`,
      ...generated.recommendation,
    },
    escalation: severityLevel === "high"
      ? { shouldSuggestExpert: true, message: generated.escalation.message || highRiskMessage(risk.reasons) }
      : generated.escalation,
    disclaimer: "Phân tích được tạo bởi AI từ dữ liệu phụ huynh vừa nhập và lịch sử EchoKid; không thay thế chẩn đoán hoặc điều trị y khoa.",
  };

  await saveRecommendation(observationId, result);
  return { ...result, createdAt: null };
}
