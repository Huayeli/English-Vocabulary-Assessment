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
  reliability: number | null;
  suspicious: boolean;
  invalid: boolean;
  flags: string | null;
  finalLevel: string | null;
  estimatedVocabulary: number | null;
  cefr: string | null;
  passed: boolean | null;
  levelMastery: LevelMastery[];
  wrongWords: {
    wordId: number;
    headword: string;
    level: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }[];
}

export const reportApi = {
  detail: (sessionId: number) => http.get<Report>(`/reports/${sessionId}`),
  list: () => http.get<Report[]>("/reports")
};
