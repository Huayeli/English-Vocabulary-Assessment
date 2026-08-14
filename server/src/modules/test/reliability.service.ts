import { prisma } from "../../utils/prisma.js";

const LEVEL_RANK: Record<string, number> = {
  K1: 1,
  K2: 2,
  K3: 3,
  K4: 4,
  K5: 5,
  K6: 6,
  K7: 7,
  K8: 8,
  K9: 9,
  K10: 10,
  K10P: 10
};

export async function assessSession(sessionId: number) {
  const session = await prisma.testSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { items: true }
  });
  const answered = session.items.filter((it) => it.userOptionIndex !== null);
  if (answered.length === 0) return;

  const totalMs = answered.reduce((sum, it) => sum + it.answerTimeMs, 0);
  const avgMs = totalMs / answered.length;
  const correctCount = answered.filter((it) => it.isCorrect).length;
  const accuracy = correctCount / answered.length;

  const flags: string[] = [];
  let score = 100;

  // 6) 选项位置集中：某个位置被选超过 60%（至少 8 题）
  const counts = new Map<number, number>();
  for (const it of answered) {
    if (it.userOptionIndex != null) {
      counts.set(it.userOptionIndex, (counts.get(it.userOptionIndex) ?? 0) + 1);
    }
  }
  const maxPos = Math.max(...counts.values());
  if (answered.length >= 8 && maxPos / answered.length >= 0.6) {
    flags.push("选项集中");
    score -= 30;
  }

  // 7) 用时与正确率矛盾：正确率很高但每题平均用时过短
  if (accuracy >= 0.8 && avgMs < 2000) {
    flags.push("答题过快");
    score -= 30;
  }

  // 8) 随机乱答：正确率接近四选一随机期望且用时极短
  if (accuracy >= 0.15 && accuracy <= 0.35 && avgMs < 2500) {
    flags.push("疑似乱答");
    score -= 40;
  }

  // 9) 自适应等级路径大起大落
  if (session.type === "ADAPTIVE") {
    let flips = 0;
    let dir = 0;
    for (let i = 1; i < answered.length; i++) {
      const d = Math.sign(LEVEL_RANK[answered[i].testedLevel] - LEVEL_RANK[answered[i - 1].testedLevel]);
      if (d !== 0) {
        if (dir !== 0 && d !== dir) flips += 1;
        dir = d;
      }
    }
    if (flips >= 3) {
      flags.push("等级波动异常");
      score -= 20;
    }
  }

  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      reliability: Math.max(0, score),
      suspicious: flags.length > 0,
      flags: flags.length ? flags.join(",") : null
    }
  });
}
