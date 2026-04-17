export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const createNotFoundError = (resource, identifier) =>
  new AppError(`${resource} not found`, 404, "NOT_FOUND", { identifier });

export const createValidationError = (message, details = null) =>
  new AppError(message, 400, "VALIDATION_ERROR", details);

export const createUnauthorizedError = (message = "Unauthorized") =>
  new AppError(message, 401, "UNAUTHORIZED");

export const createPreconditionRequiredError = (message, details = null) =>
  new AppError(message, 428, "PRECONDITION_REQUIRED", details);

export const toErrorResponse = (error) => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error"
      }
    }
  };
};
