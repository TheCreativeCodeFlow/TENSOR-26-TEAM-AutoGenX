import { controller, ok } from "../shared/http.js";
import { alertsService } from "./alerts.service.js";
import { validateCreateAlertInput, validateListAlertsQuery } from "./alerts.validator.js";

export const listAlerts = controller(async (req, res) => {
  const query = validateListAlertsQuery(req.query || {});
  return ok(res, await alertsService.list(query));
});

export const createAlert = controller(async (req, res) => {
  const input = validateCreateAlertInput(req.body || {});
  return ok(res, alertsService.create(input), 201);
});
