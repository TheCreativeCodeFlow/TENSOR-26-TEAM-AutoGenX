import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

const requestBuckets = new Map();

export function apiRateLimiter(req, _res, next) {
  const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.expiresAt <= now) {
    requestBuckets.set(key, {
      count: 1,
      expiresAt: now + env.rateLimitWindowMs,
    });
    next();
    return;
  }

  if (bucket.count >= env.rateLimitMax) {
    next(
      new AppError({
        statusCode: 429,
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please try again later.",
        details: {
          retryAfterMs: Math.max(bucket.expiresAt - now, 0),
        },
      }),
    );
    return;
  }

  bucket.count += 1;
  next();
}
