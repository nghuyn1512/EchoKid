export type Severity = "mild" | "moderate" | "high";

export interface AnalysisResult {
  flaggedPatterns: string[];
  severity: Severity;
  comparisonToBaseline: string;
}

export interface Activity {
  id: string;
  title: string;
  targetBehaviors: string[];
  ageRangeMonths: [number, number];
  durationMinutes: number;
  frameworkTag: string;
  steps: string[];
}

export interface RecommendationResult {
  logId: string;
  severityLevel: Severity;
  empathyMessage: string;
  contextSummary: string;
  recommendation: {
    activityId: string;
    title: string;
    durationMinutes: number;
    whyThis: string;
    steps: string[];
  };
  escalation: {
    shouldSuggestExpert: boolean;
    message: string | null;
  };
  disclaimer: string;
  createdAt: unknown;
}
