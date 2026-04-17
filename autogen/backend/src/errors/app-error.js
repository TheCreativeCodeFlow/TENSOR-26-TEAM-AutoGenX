export class AppError extends Error {
  constructor({
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    message = "Unexpected error occurred",
    details,
  } = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
