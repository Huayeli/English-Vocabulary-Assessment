import { http } from "./http";

export interface LevelMastery {
  level: string;
  answered: number;
  correct: number;
  rate: number;
}

export interface Report {
  sessionId: number;
  testTime: string;
  finishedTime: string | null;
  type: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number | null;
  finalLevel: string | null;
  estimatedVocabulary: number | null;
  cefr: string | null;
  passed: boolean | null;
  levelMastery: LevelMastery[];
}

export const reportApi = {
  detail: (sessionId: number) => http.get<Report>(`/reports/${sessionId}`),
  list: () => http.get<Report[]>("/reports")
};
