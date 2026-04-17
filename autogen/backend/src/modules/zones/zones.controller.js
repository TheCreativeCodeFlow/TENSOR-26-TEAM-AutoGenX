import { controller, ok } from "../shared/http.js";
import { zonesService } from "./zones.service.js";

export const listZones = controller(async (_req, res) => ok(res, await zonesService.list()));

export const getZone = controller(async (req, res) => ok(res, await zonesService.get(req.params.zoneId)));

export const locateZone = controller(async (req, res) => {
  const lat = Number(req.body?.lat);
  const lng = Number(req.body?.lng);
  return ok(res, await zonesService.locate(lat, lng));
});
