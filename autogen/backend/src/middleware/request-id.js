import { randomUUID } from "node:crypto";

export function requestIdMiddleware(req, res, next) {
  const headerRequestId = req.get("x-request-id");
  const requestId = headerRequestId || randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
