import { Router } from "express";
import { getZone, listZones, locateZone } from "./zones.controller.js";

export const zonesRouter = Router();

zonesRouter.get("/", listZones);
zonesRouter.post("/locate", locateZone);
zonesRouter.get("/:zoneId", getZone);
