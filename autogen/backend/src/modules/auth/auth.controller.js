import { controller, ok } from "../shared/http.js";
import { requireAuthUserId } from "../shared/auth-context.js";
import { profilesRepository } from "../profiles/profiles.repository.js";
import { getProfileCompletion } from "../shared/profile-completion.js";
import { authService } from "./auth.service.js";
import { validateSendOtpInput, validateVerifyOtpInput } from "./auth.validator.js";

export const sendOtp = controller(async (req, res) => {
  const input = validateSendOtpInput(req.body || {});
  const result = await authService.sendOtp(input);
  return ok(res, result, 202);
});

export const verifyOtp = controller(async (req, res) => {
  const input = validateVerifyOtpInput(req.body || {});
  const result = await authService.verifyOtp(input);
  return ok(res, result);
});

export const me = controller(async (req, res) => {
  const userId = await requireAuthUserId(req);
  const { user } = await authService.getMe(userId);
  const profile = await profilesRepository.findByUserId(userId);
  const completion = getProfileCompletion(profile);
  return ok(res, {
    user,
    profile,
    profileCompletion: completion,
  });
});

export const logout = controller(async (_req, res) => {
  const result = authService.logout();
  return ok(res, result);
});
