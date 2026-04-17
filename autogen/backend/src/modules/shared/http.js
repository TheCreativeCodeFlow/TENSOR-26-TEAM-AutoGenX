import { toErrorResponse } from "./errors.js";

export const ok = (res, payload, statusCode = 200) => res.status(statusCode).json(payload);

export const noContent = (res) => res.status(204).send();

export const handleControllerError = (res, error) => {
  const { statusCode, body } = toErrorResponse(error);
  return res.status(statusCode).json(body);
};

export const controller = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    return handleControllerError(res, error);
  }
};
