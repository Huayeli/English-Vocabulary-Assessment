import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
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
