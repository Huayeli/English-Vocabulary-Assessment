import { Router } from "express";
import * as ctrl from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const authRouter = Router();
authRouter.post("/register", ctrl.registerHandler);
authRouter.post("/login", ctrl.loginHandler);
authRouter.get("/me", requireAuth, ctrl.meHandler);
