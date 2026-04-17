import { controller, ok } from "../shared/http.js";
import { noticesService } from "./notices.service.js";
import { validateCreateNoticeInput } from "./notices.validator.js";

export const listNotices = controller(async (req, res) => {
  const status = req.query.status ? String(req.query.status) : "active";
  return ok(res, await noticesService.list(status));
});

export const createNotice = controller(async (req, res) => {
  const input = validateCreateNoticeInput(req.body || {});
  return ok(res, noticesService.create(input), 201);
});

export const expireNotice = controller(async (req, res) => ok(res, noticesService.expire(req.params.noticeId)));
