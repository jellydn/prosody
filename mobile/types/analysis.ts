export type FeedbackType = "good" | "warning" | "tip";

export interface FeedbackItem {
  type: FeedbackType;
  message: string;
}

export interface AnalysisResult {
  rhythm_score: number;
  stress_score: number;
  pacing_score: number;
  intonation_score: number;
  feedback: FeedbackItem[];
}
