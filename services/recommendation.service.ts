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
  const cached = await getRecommendation(observationId);
  if (cached) {
  const severityLevel = severityFromObservation(current, cached.severityLevel);
  return {
    ...cached,
    severityLevel,
    recommendation: {
      ...cached.recommendation,
      references: cached.recommendation.references ?? [],
    },
  };
}
  const recent = (await getObservations(childId, 30))
    .filter((item) => item.id !== observationId && item.observedAt < current.observedAt);
  const generated = await generateAIRecommendation(child, current, recent);

  const result: Omit<RecommendationResult, "createdAt"> = {
    logId: observationId,
    severityLevel: severityFromObservation(current, generated.severityLevel),
    empathyMessage: generated.empathyMessage,
    contextSummary: generated.contextSummary,
    recommendation: {
      activityId: `ai-${observationId}`,
      ...generated.recommendation,
    },
    escalation: generated.escalation,
    disclaimer: "Phân tích được tạo bởi AI từ dữ liệu phụ huynh vừa nhập và lịch sử EchoKid; không thay thế chẩn đoán hoặc điều trị y khoa.",
  };

  await saveRecommendation(observationId, result);
  return { ...result, createdAt: null };
}
