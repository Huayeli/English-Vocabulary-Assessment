import { Router } from "express";
import * as ctrl from "./wrong-word.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const wrongWordRouter = Router();
wrongWordRouter.get("/", requireAuth, ctrl.listHandler);
wrongWordRouter.delete("/:id", requireAuth, ctrl.removeHandler);
wrongWordRouter.post("/:id/review", requireAuth, ctrl.reviewHandler);
