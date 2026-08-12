import type { Response } from "express";
import type { Level } from "../generated/prisma/enums.js";
import * as vocabularyService from "./vocabulary.service.js";
import type { AuthRequest } from "../../middleware/auth.js";

const LEVELS = new Set(["K1", "K2", "K3", "K5", "K10", "K10P"]);

function parseLevel(value: unknown): Level | undefined {
  if (typeof value === "string" && LEVELS.has(value)) return value as Level;
  return undefined;
}

export async function listHandler(req: AuthRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const hasMeaning =
    req.query.hasMeaning === "true" ? true : req.query.hasMeaning === "false" ? false : undefined;
  const data = await vocabularyService.listWords({
    keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined,
    level: parseLevel(req.query.level),
    hasMeaning,
    page,
    pageSize
  });
  res.json({ code: 0, message: "ok", data });
}

export async function detailHandler(req: AuthRequest, res: Response) {
  const data = await vocabularyService.getWordDetail(Number(req.params.id));
  res.json({ code: 0, message: "ok", data });
}

export async function createHandler(req: AuthRequest, res: Response) {
  const { headword, level, bncLevel, relatedForms, meanings } = req.body ?? {};
  const data = await vocabularyService.createWord({
    headword,
    level: parseLevel(level)!,
    bncLevel,
    relatedForms,
    meanings
  });
  res.json({ code: 0, message: "ok", data });
}

export async function updateHandler(req: AuthRequest, res: Response) {
  const { level, relatedForms, status } = req.body ?? {};
  const data = await vocabularyService.updateWord(Number(req.params.id), {
    level: parseLevel(level),
    relatedForms,
    status
  });
  res.json({ code: 0, message: "ok", data });
}

export async function deleteHandler(req: AuthRequest, res: Response) {
  await vocabularyService.deleteWord(Number(req.params.id));
  res.json({ code: 0, message: "ok", data: null });
}

export async function addMeaningHandler(req: AuthRequest, res: Response) {
  const { meaning } = req.body ?? {};
  const data = await vocabularyService.addMeaning(Number(req.params.id), meaning);
  res.json({ code: 0, message: "ok", data });
}

export async function updateMeaningHandler(req: AuthRequest, res: Response) {
  const { meaning } = req.body ?? {};
  const data = await vocabularyService.updateMeaning(Number(req.params.id), meaning);
  res.json({ code: 0, message: "ok", data });
}

export async function deleteMeaningHandler(req: AuthRequest, res: Response) {
  await vocabularyService.deleteMeaning(Number(req.params.id));
  res.json({ code: 0, message: "ok", data: null });
}
