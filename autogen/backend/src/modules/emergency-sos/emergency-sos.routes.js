import { Router } from "express";
import { listMySos, raiseSos, updateSosStatus } from "./emergency-sos.controller.js";

export const emergencySosRouter = Router();

emergencySosRouter.get("/mine", listMySos);
emergencySosRouter.post("/", raiseSos);
emergencySosRouter.patch("/:eventId/status", updateSosStatus);
