import express from "express";
import cors from "cors";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { accessRouter } from "./modules/access/access.routes.js";
import { meaningRouter, vocabularyRouter } from "./modules/vocabulary/vocabulary.routes.js";
import { testRouter } from "./modules/test/test.routes.js";
import { reportRouter } from "./modules/report/report.routes.js";
import { wrongWordRouter } from "./modules/wrong-word/wrong-word.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  app.get("/health", (_req, res) => {
    res.json({ code: 0, message: "ok", data: { status: "up" } });
  });
  app.use("/api/access", accessRouter);
  app.use("/api/tests", testRouter);
  app.use("/api/reports", reportRouter);
  app.use("/api/wrong-words", wrongWordRouter);
  app.use("/api/words", vocabularyRouter);
  app.use("/api/meanings", meaningRouter);
  app.use("/api/admin", adminRouter);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const anyErr = err as { code?: number | string; message?: string };
    const code: number = typeof anyErr.code === "string" ? 40901 : anyErr.code ?? 50000;
    let status: number;
    if (code >= 40000 && code < 40100) status = 400;
    else if (code >= 40100 && code < 40200) status = 401;
    else if (code >= 40300 && code < 40400) status = 403;
    else if (code >= 40400 && code < 40500) status = 404;
    else if (code >= 40900 && code < 41000) status = 409;
    else status = 500;
    if (status === 500) console.error(err);
    res.status(status).json({ code, message: anyErr.message ?? "Internal Server Error", data: null });
  });
  return app;
}
