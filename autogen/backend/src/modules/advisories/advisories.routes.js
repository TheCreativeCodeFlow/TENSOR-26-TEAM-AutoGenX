import { Router } from "express";
import { evaluateCustomAdvisory, evaluateLiveAdvisory, listAdvisoryHistory } from "./advisories.controller.js";

export const advisoriesRouter = Router();

advisoriesRouter.get("/zone/:zoneId/live", evaluateLiveAdvisory);
advisoriesRouter.get("/current/:zoneId", evaluateLiveAdvisory);
advisoriesRouter.post("/evaluate", evaluateCustomAdvisory);
advisoriesRouter.post("/assessments", evaluateCustomAdvisory);
advisoriesRouter.get("/zone/:zoneId/history", listAdvisoryHistory);
advisoriesRouter.get("/history/:zoneId", listAdvisoryHistory);
