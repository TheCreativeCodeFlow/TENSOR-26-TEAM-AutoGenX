import { createValidationError } from "./errors.js";

export const assert = (condition, message, details = null) => {
  if (!condition) throw createValidationError(message, details);
};

export const assertRequired = (obj, keys) => {
  const missing = keys.filter((key) => obj[key] === undefined || obj[key] === null || obj[key] === "");
  if (missing.length > 0) {
    throw createValidationError("Missing required fields", { missing });
  }
};

export const assertPhone = (phone) => {
  const normalized = String(phone || "").trim();
  const isValid = /^(\+91)?[6-9]\d{9}$/.test(normalized);
  assert(isValid, "Invalid phone format. Expected Indian mobile format.");
  return normalized.startsWith("+91") ? normalized : `+91${normalized}`;
};
