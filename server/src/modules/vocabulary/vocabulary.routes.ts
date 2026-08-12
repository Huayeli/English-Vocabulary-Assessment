import { Router } from "express";
import * as ctrl from "./vocabulary.controller.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";

export const vocabularyRouter = Router();
vocabularyRouter.get("/", requireAuth, ctrl.listHandler);
vocabularyRouter.get("/:id", requireAuth, ctrl.detailHandler);
vocabularyRouter.post("/", requireAuth, requireAdmin, ctrl.createHandler);
vocabularyRouter.put("/:id", requireAuth, requireAdmin, ctrl.updateHandler);
vocabularyRouter.delete("/:id", requireAuth, requireAdmin, ctrl.deleteHandler);
vocabularyRouter.post("/:id/meanings", requireAuth, requireAdmin, ctrl.addMeaningHandler);

export const meaningRouter = Router();
meaningRouter.put("/:id", requireAuth, requireAdmin, ctrl.updateMeaningHandler);
meaningRouter.delete("/:id", requireAuth, requireAdmin, ctrl.deleteMeaningHandler);
