import { controller, ok } from "../shared/http.js";
import { advisoriesService } from "./advisories.service.js";
import { validateEvaluateInput, validateZoneParam } from "./advisories.validator.js";

export const evaluateLiveAdvisory = controller(async (req, res) => {
  const { zoneId } = validateZoneParam(req.params || {});
  return ok(res, await advisoriesService.evaluateLive(zoneId));
});

export const evaluateCustomAdvisory = controller(async (req, res) => {
  const { zoneId, conditions } = validateEvaluateInput(req.body || {});
  return ok(res, await advisoriesService.evaluate(zoneId, conditions), 201);
});

export const listAdvisoryHistory = controller(async (req, res) => {
  const { zoneId } = validateZoneParam(req.params || {});
  return ok(res, advisoriesService.listHistory(zoneId));
});
