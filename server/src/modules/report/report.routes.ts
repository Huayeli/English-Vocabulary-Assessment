import { Router } from "express";
import * as ctrl from "./report.controller.js";
import { requireCode } from "../../middleware/access.js";

export const reportRouter = Router();
reportRouter.use(requireCode);
reportRouter.get("/", ctrl.listHandler);
reportRouter.get("/:sessionId", ctrl.detailHandler);
