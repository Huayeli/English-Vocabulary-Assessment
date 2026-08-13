import { Router } from "express";
import * as ctrl from "./wrong-word.controller.js";
import { requireCode } from "../../middleware/access.js";

export const wrongWordRouter = Router();
wrongWordRouter.use(requireCode);
wrongWordRouter.get("/", ctrl.listHandler);
wrongWordRouter.delete("/:id", ctrl.removeHandler);
wrongWordRouter.post("/:id/review", ctrl.reviewHandler);
