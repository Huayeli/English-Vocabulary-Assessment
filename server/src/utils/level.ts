import { Level } from "../generated/prisma/enums.js";

const MAP: Record<string, Level> = {
  "1k": Level.K1,
  "2k": Level.K2,
  "3k": Level.K3,
  "5k": Level.K5,
  "10k": Level.K10
};

export function bncToLevel(bnc: string): Level {
  const n = parseInt(bnc.replace("k", ""), 10);
  if (n >= 11) return Level.K10P;
  const level = MAP[bnc];
  if (!level) throw new Error(`unknown bnc level: ${bnc}`);
  return level;
}

export const LEVEL_RANK: Record<Level, number> = {
  [Level.K1]: 1,
  [Level.K2]: 2,
  [Level.K3]: 3,
  [Level.K5]: 5,
  [Level.K10]: 10,
  [Level.K10P]: 10
};
