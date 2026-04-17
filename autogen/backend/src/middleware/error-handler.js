import { isProduction } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../errors/app-error.js";

export function errorHandlerMiddleware(err, req, res, _next) {
  const appError =
    err instanceof AppError
      ? err
      : new AppError({
          statusCode: 500,
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error occurred",
          details: { originalMessage: err?.message },
        });

  logger.error("request.failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: appError.statusCode,
    code: appError.code,
    message: appError.message,
    stack: isProduction ? undefined : err?.stack,
  });

  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
    },
    requestId: req.requestId,
  });
}
