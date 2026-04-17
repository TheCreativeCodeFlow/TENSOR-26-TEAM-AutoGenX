import { logger } from "../config/logger.js";

export function requestLoggerMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info("request.completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(elapsedMs.toFixed(2)),
      ip: req.ip,
    });
  });

  next();
}
