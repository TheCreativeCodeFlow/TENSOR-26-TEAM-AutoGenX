import { assert } from "../shared/validate.js";

export const validateMarineQuery = (query) => {
  const zoneId = String(query.zoneId || "").trim();
  assert(zoneId.length > 0, "zoneId query is required");
  return { zoneId };
};

export const validateForecastQuery = (query) => {
  const { zoneId } = validateMarineQuery(query);
  const rawHours = Number(query.hours || 12);
  const hours = Number.isFinite(rawHours) ? Math.max(1, Math.min(48, Math.floor(rawHours))) : 12;
  return { zoneId, hours };
};
