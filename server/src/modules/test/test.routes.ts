import { Router } from "express";
import * as ctrl from "./test.controller.js";
import { requireCode } from "../../middleware/access.js";

export const testRouter = Router();
testRouter.use(requireCode);
testRouter.get("/quota", ctrl.quotaHandler);
testRouter.get("/", ctrl.listHandler);
testRouter.get("/:sessionId", ctrl.detailHandler);
testRouter.post("/adaptive/start", ctrl.startAdaptiveHandler);
testRouter.post("/verification/start", ctrl.startVerificationHandler);
testRouter.post("/wrong-word/start", ctrl.startWrongWordHandler);
testRouter.post("/:sessionId/answer", ctrl.answerHandler);
testRouter.post("/:sessionId/abandon", ctrl.abandonHandler);
testRouter.post("/:sessionId/finish", ctrl.finishHandler);
