import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import { issueCode } from "./verification.service.js";
import type { AuthRequest } from "../../middleware/auth.js";

export async function registerHandler(req: Request, res: Response) {
  const { username, password, email } = req.body ?? {};
  const data = await authService.register(username, password, email);
  res.json({ code: 0, message: "ok", data });
}

export async function loginHandler(req: Request, res: Response) {
  const { username, password } = req.body ?? {};
  const data = await authService.login(username, password);
  res.json({ code: 0, message: "ok", data });
}

export async function meHandler(req: AuthRequest, res: Response) {
  const data = await authService.me(req.user!.userId);
  res.json({ code: 0, message: "ok", data });
}

export async function emailCodeHandler(req: Request, res: Response) {
  const { email } = req.body ?? {};
  await authService.ensureEmailBound(email);
  await issueCode(email, "LOGIN");
  res.json({ code: 0, message: "ok", data: null });
}

export async function loginByEmailHandler(req: Request, res: Response) {
  const { email, code } = req.body ?? {};
  const data = await authService.loginByEmail(email, code);
  res.json({ code: 0, message: "ok", data });
}

export async function bindEmailCodeHandler(req: AuthRequest, res: Response) {
  const { email } = req.body ?? {};
  await issueCode(email, "BIND");
  res.json({ code: 0, message: "ok", data: null });
}

export async function bindEmailHandler(req: AuthRequest, res: Response) {
  const { email, code } = req.body ?? {};
  const data = await authService.bindEmail(req.user!.userId, email, code);
  res.json({ code: 0, message: "ok", data });
}

export async function resetPasswordCodeHandler(req: Request, res: Response) {
  const { email } = req.body ?? {};
  await authService.ensureEmailBound(email);
  await issueCode(email, "RESET");
  res.json({ code: 0, message: "ok", data: null });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const { email, code, newPassword } = req.body ?? {};
  await authService.resetPassword(email, code, newPassword);
  res.json({ code: 0, message: "ok", data: null });
}
