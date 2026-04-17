import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { createUnauthorizedError, createValidationError } from "./errors.js";

const resolveJwtSecret = () => String(env.jwtSecret || process.env.JWT_SECRET || "").trim();
const resolveJwtExpiresIn = () => String(env.jwtExpiresIn || process.env.JWT_EXPIRES_IN || "7d").trim() || "7d";

const ensureJwtConfig = () => {
  if (!resolveJwtSecret()) {
    throw createValidationError("JWT_SECRET is required for authentication.");
  }
};

export const signAccessToken = (user) => {
  ensureJwtConfig();
  const jwtSecret = resolveJwtSecret();
  return jwt.sign(
    {
      sub: user.id,
      phone: user.phone,
      role: user.role || "fisherfolk",
    },
    jwtSecret,
    { expiresIn: resolveJwtExpiresIn() },
  );
};

export const verifyAccessToken = (token) => {
  ensureJwtConfig();
  const jwtSecret = resolveJwtSecret();
  try {
    return jwt.verify(token, jwtSecret);
  } catch (_error) {
    throw createUnauthorizedError("Invalid or expired access token.");
  }
};
