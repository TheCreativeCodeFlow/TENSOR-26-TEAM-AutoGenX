import { assert, assertPhone, assertRequired } from "../shared/validate.js";

export const validateUpsertProfileInput = (body) => {
  assertRequired(body, ["fullName", "age", "coastalArea", "locationLabel", "language", "boatType", "phone", "latitude", "longitude"]);
  const language = String(body.language || "en").toLowerCase();
  assert(["en", "ta", "ml", "te", "or"].includes(language), "Unsupported language");
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  assert(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90, "latitude must be a valid coordinate");
  assert(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180, "longitude must be a valid coordinate");
  return {
    fullName: String(body.fullName).trim(),
    age: Number(body.age),
    coastalArea: String(body.coastalArea).trim(),
    primaryZoneId: String(body.primaryZoneId || body.coastalAreaId || "").trim(),
    locationLabel: String(body.locationLabel).trim(),
    latitude,
    longitude,
    language,
    boatType: String(body.boatType).trim(),
    phone: assertPhone(body.phone),
    safetyPhone: body.safetyPhone ? assertPhone(body.safetyPhone) : undefined,
    village: body.village ? String(body.village).trim() : undefined,
    district: body.district ? String(body.district).trim() : undefined,
    state: body.state ? String(body.state).trim() : undefined,
    pincode: body.pincode ? String(body.pincode).trim() : undefined,
    emergencyContactName: body.emergencyContactName ? String(body.emergencyContactName).trim() : undefined,
    emergencyContactPhone: body.emergencyContactPhone ? assertPhone(body.emergencyContactPhone) : undefined,
    relationship: body.relationship ? String(body.relationship).trim() : undefined,
    yearsOfExperience: body.yearsOfExperience !== undefined ? Number(body.yearsOfExperience) : undefined,
  };
};
