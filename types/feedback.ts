export interface FeedbackInput {
  childId: string;
  observationId: string;
  content: string;
  wasHelpful?: boolean;
  rating?: number;
}

export interface FeedbackRecord extends FeedbackInput {
  id: string;
  createdAt: unknown;
  updatedAt: unknown;
}
