import { requireAuthUserId } from "../shared/auth-context.js";
import { controller, ok } from "../shared/http.js";
import { profilesService } from "./profiles.service.js";
import { validateUpsertProfileInput } from "./profiles.validator.js";

export const getMyProfile = controller(async (req, res) => {
  const userId = await requireAuthUserId(req);
  return ok(res, await profilesService.getByUserId(userId));
});

export const upsertMyProfile = controller(async (req, res) => {
  const userId = await requireAuthUserId(req);
  const payload = validateUpsertProfileInput(req.body || {});
  return ok(res, await profilesService.upsertByUserId(userId, payload));
});
