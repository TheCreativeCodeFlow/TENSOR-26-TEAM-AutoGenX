import { assert, assertRequired } from "../shared/validate.js";

export const validateZoneParam = (params) => {
  const zoneId = String(params.zoneId || "").trim();
  assert(zoneId.length > 0, "zoneId is required");
  return { zoneId };
};

export const validateEvaluateInput = (body) => {
  assertRequired(body, ["zoneId", "conditions"]);
  const { zoneId, conditions } = body;
  assert(typeof conditions.windSpeedKmph === "number", "conditions.windSpeedKmph must be number");
  assert(typeof conditions.waveHeightM === "number", "conditions.waveHeightM must be number");
  assert(typeof conditions.visibilityKm === "number", "conditions.visibilityKm must be number");
  assert(typeof conditions.stormIndex === "number", "conditions.stormIndex must be number");
  return { zoneId, conditions };
};
