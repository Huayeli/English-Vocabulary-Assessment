import { describe, it, expect } from "vitest";
import { Level } from "../src/generated/prisma/enums.js";
import { applyLevelRules, computeStreaks, LEVEL_SEQUENCE } from "../src/modules/test/adaptive.engine.js";

describe("applyLevelRules", () => {
  it("4 correct in a row raises level", () => {
    expect(applyLevelRules(Level.K3, 4, 0)).toBe(Level.K5);
  });

  it("2 wrong in a row lowers level", () => {
    expect(applyLevelRules(Level.K5, 0, 2)).toBe(Level.K3);
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

  it("sequence has the 6 fixed levels in order", () => {
    expect(LEVEL_SEQUENCE).toEqual([Level.K1, Level.K2, Level.K3, Level.K5, Level.K10, Level.K10P]);
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
});
