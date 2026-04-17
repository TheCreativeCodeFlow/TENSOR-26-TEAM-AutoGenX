import { env } from "../../config/env.js";
import { createUnauthorizedError } from "./errors.js";
import { verifyAccessToken } from "./jwt.js";

export const getAuthUserId = async (req) => {
  if (req.authUserId) return req.authUserId;

  const explicitUserId = req.headers["x-user-id"];
  if (!env.allowDemoAuthFallback && explicitUserId) {
    throw createUnauthorizedError("x-user-id header is disabled. Use backend Bearer access token.");
  }
  if (env.allowDemoAuthFallback && explicitUserId) {
    req.authUserId = explicitUserId;
    return explicitUserId;
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  if (token.startsWith("mock-token-")) {
    if (!env.allowDemoAuthFallback) {
      throw createUnauthorizedError("Mock bearer tokens are disabled. Use backend Bearer access token.");
    }
    const fallbackUserId = env.allowDemoAuthFallback ? token.slice("mock-token-".length) : null;
    req.authUserId = fallbackUserId;
    return fallbackUserId;
  }

  const claims = verifyAccessToken(token);
  req.authUser = claims;
  req.authUserId = claims?.sub || null;
  return req.authUserId;
};

export const requireAuthUser = async (req) => {
  const userId = await requireAuthUserId(req);
  if (!userId) {
    throw createUnauthorizedError("Authentication required. Provide a valid backend Bearer access token.");
  }

  if (req.authUser) return req.authUser;
  return { id: userId };
};

export const requireAuthUserId = async (req) => {
  const userId = await getAuthUserId(req);
  if (!userId) {
    throw createUnauthorizedError(
      env.allowDemoAuthFallback
        ? "Authentication required. Provide a backend Bearer access token, or use x-user-id / Bearer mock-token-<userId> in demo mode."
        : "Authentication required. Provide a backend Bearer access token.",
    );
  }
  return userId;
};
