import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import * as userService from "./user.service.js";
import { getQuota } from "../plan/plan.service.js";

export async function homeHandler(req: AuthRequest, res: Response) {
  const data = await userService.getHome(req.user!.userId);
  res.json({ code: 0, message: "ok", data });
}

export async function profileHandler(req: AuthRequest, res: Response) {
  const { avatar } = req.body ?? {};
  const data = await userService.updateProfile(req.user!.userId, avatar);
  res.json({ code: 0, message: "ok", data });
}

export async function myPlanHandler(req: AuthRequest, res: Response) {
  const data = await getQuota(req.user!.userId);
  res.json({ code: 0, message: "ok", data });
}
