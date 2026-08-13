import { defineStore } from "pinia";
import { testApi, type AnswerResult, type TestQuestion } from "../api/test";

export interface QuestionState {
  q: TestQuestion;
  selectedIndex: number | null;
}

export const useTestStore = defineStore("test", {
  state: () => ({
    sessionId: null as number | null,
    totalQuestions: 30,
    currentLevel: "",
    startedAt: 0,
    finished: false,
    questions: [] as QuestionState[],
    seq: 0
  }),
  actions: {
    reset() {
      this.sessionId = null;
      this.totalQuestions = 30;
      this.currentLevel = "";
      this.startedAt = 0;
      this.finished = false;
      this.questions = [];
      this.seq = 0;
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
      this.questions = [{ q: res.question, selectedIndex: null }];
      this.seq = 1;
      this.startedAt = Date.now();
    },
    async ensureStart(kind: "adaptive" | "verification", level?: string) {
      const active = await testApi.active();
      if (active.hasActive) return { needsConfirm: true };
      await this.start(kind, level);
      return { needsConfirm: false };
    },
    async abandonActiveAndStart(kind: "adaptive" | "verification", level?: string) {
      await testApi.abandonActive();
      await this.start(kind, level);
    },
    async answer(optionIndex: number, seq?: number): Promise<AnswerResult> {
      const idx = (seq ?? this.seq) - 1;
      const res = await testApi.answer(this.sessionId!, optionIndex, Date.now() - this.startedAt, seq);
      if (this.questions[idx]) this.questions[idx].selectedIndex = optionIndex;
      this.startedAt = Date.now();
      if (res.finished) {
        this.finished = true;
        return res;
      }
      this.currentLevel = res.currentLevel ?? this.currentLevel;
      if (res.nextQuestion && !this.questions.some((q) => q.q.seq === res.nextQuestion!.seq)) {
        this.questions.push({ q: res.nextQuestion, selectedIndex: null });
      }
      return res;
    },
    next() {
      if (this.seq < this.questions.length) this.seq += 1;
    },
    prev() {
      if (this.seq > 1) this.seq -= 1;
    }
  }
});

interface StartTestResult {
  sessionId: number;
  totalQuestions: number;
  currentLevel: string;
  question: TestQuestion;
}
