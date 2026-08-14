import { describe, it, expect } from "vitest";
import { Level } from "../src/generated/prisma/enums.js";
import {
  applyLevelRules,
  computeFinalLevel,
  computeStreaks,
  LEVEL_SEQUENCE
} from "../src/modules/test/adaptive.engine.js";

describe("applyLevelRules", () => {
  it("4 correct in a row raises one level (K3 -> K4)", () => {
    expect(applyLevelRules(Level.K3, 4, 0)).toBe(Level.K4);
  });

  it("4 correct in a row raises one level (K4 -> K5)", () => {
    expect(applyLevelRules(Level.K4, 4, 0)).toBe(Level.K5);
  });

  it("2 wrong in a row lowers one level (K5 -> K4)", () => {
    expect(applyLevelRules(Level.K5, 0, 2)).toBe(Level.K4);
  });

  it("2 wrong in a row lowers one level (K4 -> K3)", () => {
    expect(applyLevelRules(Level.K4, 0, 2)).toBe(Level.K3);
  });

  it("K1 never goes below", () => {
    expect(applyLevelRules(Level.K1, 0, 2)).toBe(Level.K1);
  });

  it("K10P never goes above", () => {
    expect(applyLevelRules(Level.K10P, 4, 0)).toBe(Level.K10P);
  });

  it("streaks below threshold keep level", () => {
    expect(applyLevelRules(Level.K3, 3, 0)).toBe(Level.K3);
    expect(applyLevelRules(Level.K5, 0, 1)).toBe(Level.K5);
  });

  it("sequence has all 11 levels in order without gaps", () => {
    expect(LEVEL_SEQUENCE).toEqual([
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
    ]);
  });
});

describe("computeStreaks", () => {
  it("counts trailing correct answers", () => {
    expect(computeStreaks([{ isCorrect: false }, { isCorrect: true }, { isCorrect: true }])).toEqual({
      streakCorrect: 2,
      streakWrong: 0
    });
  });

  it("counts trailing wrong answers", () => {
    expect(computeStreaks([{ isCorrect: true }, { isCorrect: false }, { isCorrect: false }])).toEqual({
      streakCorrect: 0,
      streakWrong: 2
    });
  });

  it("returns zeros for empty items", () => {
    expect(computeStreaks([])).toEqual({ streakCorrect: 0, streakWrong: 0 });
  });

  it("resets streak when the level changes", () => {
    expect(
      computeStreaks([
        { testedLevel: Level.K3, isCorrect: true },
        { testedLevel: Level.K3, isCorrect: true },
        { testedLevel: Level.K4, isCorrect: true }
      ])
    ).toEqual({ streakCorrect: 1, streakWrong: 0 });
  });

  it("counts wrong streak within the same level only", () => {
    expect(
      computeStreaks([
        { testedLevel: Level.K4, isCorrect: false },
        { testedLevel: Level.K3, isCorrect: false },
        { testedLevel: Level.K3, isCorrect: false }
      ])
    ).toEqual({ streakCorrect: 0, streakWrong: 2 });
  });
});

describe("computeFinalLevel", () => {
  it("returns the highest level with >=2 answers and >=80% accuracy", () => {
    const items = [
      ...[1, 2, 3, 4].map(() => ({ testedLevel: Level.K3, isCorrect: true })),
      ...[1, 2, 3, 4, 5, 6, 7, 8].map(() => ({ testedLevel: Level.K4, isCorrect: true })),
      ...Array.from({ length: 12 }, (_, i) => ({ testedLevel: Level.K5, isCorrect: i === 0 }))
    ];
    expect(computeFinalLevel(items)).toBe(Level.K4);
  });

  it("ignores a single correct answer at a level", () => {
    const items = [
      ...[1, 2, 3, 4].map(() => ({ testedLevel: Level.K3, isCorrect: true })),
      ...[1, 2, 3, 4].map(() => ({ testedLevel: Level.K4, isCorrect: true })),
      { testedLevel: Level.K5, isCorrect: true }
    ];
    expect(computeFinalLevel(items)).toBe(Level.K4);
  });

  it("requires 80% mastery within a level", () => {
    const items = [
      ...[1, 2, 3, 4].map(() => ({ testedLevel: Level.K3, isCorrect: true })),
      ...[1, 2, 3, 4].map(() => ({ testedLevel: Level.K4, isCorrect: true })),
      ...[true, true, false, false].map((c) => ({ testedLevel: Level.K5, isCorrect: c }))
    ];
    expect(computeFinalLevel(items)).toBe(Level.K4);
  });

  it("falls back to the most-answered level when nothing passes", () => {
    const items = [
      ...[false, false].map((c) => ({ testedLevel: Level.K3, isCorrect: c })),
      { testedLevel: Level.K2, isCorrect: false },
      ...Array.from({ length: 27 }, () => ({ testedLevel: Level.K1, isCorrect: false }))
    ];
    expect(computeFinalLevel(items)).toBe(Level.K1);
  });

  it("returns K10P when all levels are mastered", () => {
    const mastered = (level: Level, n: number) => Array.from({ length: n }, () => ({ testedLevel: level, isCorrect: true }));
    const items = [
      ...mastered(Level.K3, 4),
      ...mastered(Level.K4, 4),
      ...mastered(Level.K5, 4),
      ...mastered(Level.K6, 4),
      ...mastered(Level.K7, 4),
      ...mastered(Level.K8, 4),
      ...mastered(Level.K9, 4),
      ...mastered(Level.K10, 4),
      ...mastered(Level.K10P, 8)
    ];
    expect(computeFinalLevel(items)).toBe(Level.K10P);
  });
});
