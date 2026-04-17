import { requireAuthUserId } from "../shared/auth-context.js";
import { controller, ok } from "../shared/http.js";
import { emergencySosService } from "./emergency-sos.service.js";
import { validateCreateSosInput, validateSosStatusInput } from "./emergency-sos.validator.js";

export const raiseSos = controller(async (req, res) => {
  const userId = await requireAuthUserId(req);
  const input = validateCreateSosInput(req.body || {});
  return ok(res, await emergencySosService.raise(userId, input), 201);
});

export const listMySos = controller(async (req, res) => {
  const userId = await requireAuthUserId(req);
  const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
  return ok(res, await emergencySosService.list(userId, status));
});

export const updateSosStatus = controller(async (req, res) => {
  const { status } = validateSosStatusInput(req.body || {});
  return ok(res, await emergencySosService.updateStatus(req.params.eventId, status));
});
