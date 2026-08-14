import { Level } from "../../generated/prisma/enums.js";

export const LEVEL_SEQUENCE: Level[] = [
  Level.K1,
  Level.K2,
  Level.K3,
  Level.K4,
  Level.K5,
  Level.K6,
  Level.K7,
  Level.K8,
  Level.K9,
  Level.K10,
  Level.K10P
];

export function applyLevelRules(current: Level, streakCorrect: number, streakWrong: number): Level {
  const idx = LEVEL_SEQUENCE.indexOf(current);
  if (streakCorrect >= 4 && idx >= 0 && idx < LEVEL_SEQUENCE.length - 1) {
    return LEVEL_SEQUENCE[idx + 1];
  }
  if (streakWrong >= 2 && idx > 0) {
    return LEVEL_SEQUENCE[idx - 1];
  }
  return current;
}

export function computeStreaks(
  items: { isCorrect: boolean; testedLevel?: Level }[]
): { streakCorrect: number; streakWrong: number } {
  const last = items[items.length - 1];
  if (!last) return { streakCorrect: 0, streakWrong: 0 };
  const target = last.isCorrect ? "correct" : "wrong";
  let count = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    // 升级/降级后连对计数重置：只统计当前等级内的连续结果
    if (last.testedLevel !== undefined && it.testedLevel !== last.testedLevel) break;
    const ok = it.isCorrect;
    if ((target === "correct" && ok) || (target === "wrong" && !ok)) count += 1;
    else break;
  }
  return target === "correct" ? { streakCorrect: count, streakWrong: 0 } : { streakCorrect: 0, streakWrong: count };
}

const MASTERY_THRESHOLD = 0.8;
const MIN_SAMPLES = 2;

/**
 * 最终等级 = 从低到高最后一个"答题 >= 2 题且正确率 >= 80%"的档位；
 * 若没有任何档达标，回退到答题数最多的档位（并列取较低档）。
 */
export function computeFinalLevel(items: { testedLevel: Level; isCorrect: boolean }[]): Level {
  const byLevel = new Map<Level, { answered: number; correct: number }>();
  for (const it of items) {
    const entry = byLevel.get(it.testedLevel) ?? { answered: 0, correct: 0 };
    entry.answered += 1;
    if (it.isCorrect) entry.correct += 1;
    byLevel.set(it.testedLevel, entry);
  }

  let passed: Level | null = null;
  for (const level of LEVEL_SEQUENCE) {
    const entry = byLevel.get(level);
    if (entry && entry.answered >= MIN_SAMPLES && entry.correct / entry.answered >= MASTERY_THRESHOLD) {
      passed = level;
    }
  }
  if (passed) return passed;

  let fallback: Level = LEVEL_SEQUENCE[0];
  let maxAnswered = 0;
  for (const level of LEVEL_SEQUENCE) {
    const entry = byLevel.get(level);
    if (entry && entry.answered > maxAnswered) {
      maxAnswered = entry.answered;
      fallback = level;
    }
  }
  return fallback;
}
