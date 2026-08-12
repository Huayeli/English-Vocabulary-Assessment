import express from "express";
import cors from "cors";
import type { NextFunction, Request, Response } from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { meaningRouter, vocabularyRouter } from "./modules/vocabulary/vocabulary.routes.js";
import { testRouter } from "./modules/test/test.routes.js";
import { reportRouter } from "./modules/report/report.routes.js";
import { wrongWordRouter } from "./modules/wrong-word/wrong-word.routes.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/health", (_req, res) => {
    res.json({ code: 0, message: "ok", data: { status: "up" } });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/words", vocabularyRouter);
  app.use("/api/meanings", meaningRouter);
  app.use("/api/tests", testRouter);
  app.use("/api/reports", reportRouter);
  app.use("/api/wrong-words", wrongWordRouter);
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const anyErr = err as { code?: number; message?: string };
    let code = anyErr.code ?? 50000;
    if (code === "P2002") code = 40901; // Prisma 唯一约束冲突
    const status = code >= 40000 && code < 50000 ? 400 : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ code, message: anyErr.message ?? "服务器内部错误", data: null });
  });
  return app;
}
