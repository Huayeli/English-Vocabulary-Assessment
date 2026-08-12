import { defineStore } from "pinia";
import { testApi, type AnswerResult, type TestQuestion } from "../api/test";

export const useTestStore = defineStore("test", {
  state: () => ({
    sessionId: null as number | null,
    totalQuestions: 30,
    currentLevel: "",
    question: null as TestQuestion | null,
    startedAt: 0,
    finished: false,
    lastResult: null as { isCorrect: boolean; correctIndex: number; selectedIndex: number } | null
  }),
  actions: {
    reset() {
      this.sessionId = null;
      this.totalQuestions = 30;
      this.currentLevel = "";
      this.question = null;
      this.startedAt = 0;
      this.finished = false;
      this.lastResult = null;
    },
    async start(kind: "adaptive" | "verification" | "wrong", level?: string) {
      this.reset();
      const res: StartTestResult =
        kind === "adaptive"
          ? await testApi.startAdaptive()
          : kind === "verification"
            ? await testApi.startVerification(level!)
            : await testApi.startWrongWord();
      this.sessionId = res.sessionId;
      this.totalQuestions = res.totalQuestions;
      this.currentLevel = res.currentLevel;
      this.question = res.question;
      this.startedAt = Date.now();
    },
    async answer(optionIndex: number): Promise<AnswerResult> {
      const res = await testApi.answer(this.sessionId!, optionIndex, Date.now() - this.startedAt);
      this.lastResult = { isCorrect: res.isCorrect, correctIndex: res.correctIndex, selectedIndex: optionIndex };
      this.startedAt = Date.now();
      if (res.finished) {
        this.finished = true;
        return res;
      }
      this.currentLevel = res.currentLevel ?? this.currentLevel;
      this.question = res.nextQuestion!;
      return res;
    }
  }
});

interface StartTestResult {
  sessionId: number;
  totalQuestions: number;
  currentLevel: string;
  question: TestQuestion;
}
