import { Router } from "express";
import * as ctrl from "./access.controller.js";

export const accessRouter = Router();
accessRouter.post("/validate", ctrl.validateHandler);
