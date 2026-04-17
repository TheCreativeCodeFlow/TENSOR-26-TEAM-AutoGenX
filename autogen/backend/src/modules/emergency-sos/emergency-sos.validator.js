import { assert, assertRequired } from "../shared/validate.js";

export const validateCreateSosInput = (body) => {
  assertRequired(body, ["zoneId", "location"]);
  assert(typeof body.location.lat === "number", "location.lat must be number");
  assert(typeof body.location.lng === "number", "location.lng must be number");
  return {
    zoneId: String(body.zoneId),
    location: body.location,
    message: body.message ? String(body.message) : "Emergency SOS triggered",
    distressType: body.distressType ? String(body.distressType) : "UNSPECIFIED"
  };
};

export const validateSosStatusInput = (body) => {
  assertRequired(body, ["status"]);
  const status = String(body.status).toUpperCase();
  assert(["OPEN", "ACKNOWLEDGED", "RESOLVED", "FALSE_ALARM"].includes(status), "Invalid SOS status");
  return { status };
};
