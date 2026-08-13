import { Router } from "express";
import * as ctrl from "./admin.controller.js";
import { requireAdminKey } from "../../middleware/access.js";

export const adminRouter = Router();
adminRouter.use(requireAdminKey);
adminRouter.get("/dashboard", ctrl.dashboardHandler);
adminRouter.get("/codes", ctrl.listCodesHandler);
adminRouter.post("/codes/generate", ctrl.generateCodesHandler);
adminRouter.post("/codes/batch", ctrl.batchCodesHandler);
adminRouter.put("/codes/:id", ctrl.updateCodeHandler);
adminRouter.get("/batches", ctrl.listBatchesHandler);
adminRouter.get("/tests", ctrl.listTestsHandler);
adminRouter.get("/tests/:id", ctrl.testDetailHandler);
adminRouter.put("/tests/:id/invalid", ctrl.setTestInvalidHandler);
adminRouter.get("/questions", ctrl.listQuestionsHandler);
adminRouter.post("/questions", ctrl.createQuestionHandler);
adminRouter.put("/questions/:id", ctrl.updateQuestionHandler);
adminRouter.delete("/questions/:id", ctrl.deleteQuestionHandler);
