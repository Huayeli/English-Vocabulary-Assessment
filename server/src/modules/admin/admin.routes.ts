import { Router } from "express";
import * as ctrl from "./admin.controller.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/users", ctrl.listUsersHandler);
adminRouter.get("/users/:id", ctrl.userDetailHandler);
adminRouter.put("/users/:id/package", ctrl.setPackageHandler);
adminRouter.get("/questions", ctrl.listQuestionsHandler);
adminRouter.post("/questions", ctrl.createQuestionHandler);
adminRouter.put("/questions/:id", ctrl.updateQuestionHandler);
adminRouter.delete("/questions/:id", ctrl.deleteQuestionHandler);
adminRouter.get("/stats/overview", ctrl.statsHandler);
