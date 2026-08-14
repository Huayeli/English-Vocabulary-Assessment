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

export function computeStreaks(items: { isCorrect: boolean }[]): { streakCorrect: number; streakWrong: number } {
  const last = items[items.length - 1];
  if (!last) return { streakCorrect: 0, streakWrong: 0 };
  const target = last.isCorrect ? "correct" : "wrong";
  let count = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    const ok = items[i].isCorrect;
    if ((target === "correct" && ok) || (target === "wrong" && !ok)) count += 1;
    else break;
  }
  return target === "correct" ? { streakCorrect: count, streakWrong: 0 } : { streakCorrect: 0, streakWrong: count };
}
