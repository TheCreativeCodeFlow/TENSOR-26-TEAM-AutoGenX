import { assertRequired } from "../shared/validate.js";

export const validateCreateAlertInput = (body) => {
  assertRequired(body, ["zoneId", "severity", "level", "title", "message"]);
  return body;
};

export const validateListAlertsQuery = (query) => ({
  severity: query.severity ? String(query.severity) : undefined,
  zoneId: query.zoneId ? String(query.zoneId) : undefined
});
