import { Router } from "express";
import * as ctrl from "./vocabulary.controller.js";
import { requireAdminKey } from "../../middleware/access.js";

export const vocabularyRouter = Router();
vocabularyRouter.use(requireAdminKey);
vocabularyRouter.get("/", ctrl.listHandler);
vocabularyRouter.get("/:id", ctrl.detailHandler);
vocabularyRouter.post("/", ctrl.createHandler);
vocabularyRouter.put("/:id", ctrl.updateHandler);
vocabularyRouter.delete("/:id", ctrl.deleteHandler);
vocabularyRouter.post("/:id/meanings", ctrl.addMeaningHandler);

export const meaningRouter = Router();
meaningRouter.use(requireAdminKey);
meaningRouter.put("/:id", ctrl.updateMeaningHandler);
meaningRouter.delete("/:id", ctrl.deleteMeaningHandler);
