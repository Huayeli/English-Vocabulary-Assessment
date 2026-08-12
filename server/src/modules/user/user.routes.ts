import { Router } from "express";
import * as ctrl from "./user.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const userRouter = Router();
userRouter.get("/home", requireAuth, ctrl.homeHandler);
userRouter.put("/profile", requireAuth, ctrl.profileHandler);
userRouter.get("/plan", requireAuth, ctrl.myPlanHandler);
