import { AppError } from "../errors/app-error.js";

export function notFoundMiddleware(req, _res, next) {
  next(
    new AppError({
      statusCode: 404,
      code: "ROUTE_NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    }),
  );
}
