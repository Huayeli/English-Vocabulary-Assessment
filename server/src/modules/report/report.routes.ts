import { Router } from "express";
import * as ctrl from "./report.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const reportRouter = Router();
reportRouter.get("/", requireAuth, ctrl.listHandler);
reportRouter.get("/:sessionId", requireAuth, ctrl.detailHandler);
