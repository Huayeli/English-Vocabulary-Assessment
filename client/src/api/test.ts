import { http } from "./http";

export interface TestQuestion {
  seq: number;
  word: string;
  question: string;
  options: string[];
  testedLevel: string;
}

export interface StartTestResult {
  sessionId: number;
  totalQuestions: number;
  currentLevel: string;
  question: TestQuestion;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctIndex: number;
  currentLevel?: string;
  finished: boolean;
  nextQuestion?: TestQuestion;
  reportId?: number;
}

export const testApi = {
  quota: () => http.get<QuotaInfo>("/tests/quota"),
  startAdaptive: () => http.post<StartTestResult>("/tests/adaptive/start"),
  startVerification: (level: string) => http.post<StartTestResult>("/tests/verification/start", { level }),
  startWrongWord: () => http.post<StartTestResult>("/tests/wrong-word/start"),
  answer: (sessionId: number, optionIndex: number, answerTimeMs: number) =>
    http.post<AnswerResult>(`/tests/${sessionId}/answer`, { optionIndex, answerTimeMs }),
  history: (params?: { type?: string; page?: number }) => http.get("/tests", { params }),
  detail: (sessionId: number) => http.get(`/tests/${sessionId}`)
};

export interface QuotaInfo {
  packageCode: string;
  packageName: string;
  remainingDailyTests: number | null;
  remainingTestCount: number;
  verificationEnabled: boolean;
  wrongBookEnabled: boolean;
  historyEnabled: boolean;
}
