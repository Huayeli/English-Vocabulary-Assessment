import { Router } from "express";
import * as ctrl from "./plan.controller.js";

export const plansRouter = Router();
plansRouter.get("/", ctrl.listHandler);
