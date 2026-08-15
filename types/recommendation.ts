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
    references?: ActivityReference[];
    steps: string[];
  };
  escalation: {
    shouldSuggestExpert: boolean;
    message: string | null;
  };
  disclaimer: string;
  createdAt: unknown;
}
export interface RecommendationFeedback {
  status: "NOT_TRIED" | "TRIED_HELPED" | "TRIED_NOT_HELPED" | "NOT_APPLICABLE";
  note?: string;
  confirmedAt: number;
  confirmedBy: string;
}
export interface ChildRecommendationMemory {
  preferredActivities: string[];
  avoidedActivities: string[];   
  helpfulContexts: string[];       
  ineffectiveContexts: string[]; 
  lastUpdatedAt: number;
} 
export type ActivityReferenceKey =
| "esdm"
| "aba"
| "sensory_regulation"
| "who_cst"
| "aap_co_regulation"
| "cdc_play";
 
export interface ActivityReference {
key: ActivityReferenceKey;
title: string;
organization: string;
note: string;
}