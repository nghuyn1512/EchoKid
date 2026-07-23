export type Mood = "calm" | "irritable" | "anxious" | "happy" | "withdrawn";
export type SleepQuality = "good" | "restless" | "poor";
export type Level = "low" | "medium" | "high";

export interface MeltdownEvent {
  time: string; // "HH:mm"
  trigger: string;
}

export interface DailyLog {
  id: string; // `${childId}_${date}`
  childId: string;
  date: string; // "yyyy-MM-dd"
  mood: Mood;
  sleep: {
    hours: number;
    quality: SleepQuality;
  };
  meal: {
    ateNormally: boolean;
    notes?: string;
  };
  meltdown: {
    totalCount: number;
    events: MeltdownEvent[];
  };
  socialInteraction: Level;
  focus: Level;
  freeTextNote?: string;
  status: "in_progress" | "completed";
  editableUntil: string;
  updatedAt: unknown;
}
export interface DailyLogInput {
  childId: string;
  date: string;
  mood?: Mood;
  sleep?: { hours: number; quality: SleepQuality };
  meal?: { ateNormally: boolean; notes?: string };
  meltdownEvent?: { trigger: string }; 
  socialInteraction?: Level;
  focus?: Level;
  freeTextNote?: string;
  markCompleted?: boolean;
}