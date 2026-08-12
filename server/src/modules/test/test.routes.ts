import { Router } from "express";
import * as ctrl from "./test.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const testRouter = Router();
testRouter.get("/quota", requireAuth, ctrl.quotaHandler);
testRouter.get("/", requireAuth, ctrl.listHandler);
testRouter.get("/:sessionId", requireAuth, ctrl.detailHandler);
testRouter.post("/adaptive/start", requireAuth, ctrl.startAdaptiveHandler);
testRouter.post("/verification/start", requireAuth, ctrl.startVerificationHandler);
testRouter.post("/wrong-word/start", requireAuth, ctrl.startWrongWordHandler);
testRouter.post("/:sessionId/answer", requireAuth, ctrl.answerHandler);
testRouter.post("/:sessionId/abandon", requireAuth, ctrl.abandonHandler);
testRouter.post("/:sessionId/finish", requireAuth, ctrl.finishHandler);
