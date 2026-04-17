import { Router } from "express";
import { createAlert, listAlerts } from "./alerts.controller.js";

export const alertsRouter = Router();

alertsRouter.get("/", listAlerts);
alertsRouter.post("/", createAlert);
