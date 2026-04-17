import { assertRequired } from "../shared/validate.js";

export const validateCreateNoticeInput = (body) => {
  assertRequired(body, ["zoneId", "priority", "text"]);
  return body;
};
