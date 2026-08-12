import { Router } from "express";
import * as ctrl from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const authRouter = Router();
authRouter.post("/register", ctrl.registerHandler);
authRouter.post("/login", ctrl.loginHandler);
authRouter.post("/email-code", ctrl.emailCodeHandler);
authRouter.post("/login-by-email", ctrl.loginByEmailHandler);
authRouter.post("/bind-email-code", requireAuth, ctrl.bindEmailCodeHandler);
authRouter.post("/bind-email", requireAuth, ctrl.bindEmailHandler);
authRouter.post("/reset-password-code", ctrl.resetPasswordCodeHandler);
authRouter.post("/reset-password", ctrl.resetPasswordHandler);
authRouter.get("/me", requireAuth, ctrl.meHandler);
