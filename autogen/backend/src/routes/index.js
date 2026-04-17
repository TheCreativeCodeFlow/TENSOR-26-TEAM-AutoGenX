import { Router } from "express";
import { env } from "../config/env.js";
import { advisoriesRouter } from "../modules/advisories/advisories.routes.js";
import { alertsRouter } from "../modules/alerts/alerts.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { emergencySosRouter } from "../modules/emergency-sos/emergency-sos.routes.js";
import { marineWeatherRouter } from "../modules/marine-weather/marine-weather.routes.js";
import { noticesRouter } from "../modules/notices/notices.routes.js";
import { profilesRouter } from "../modules/profiles/profiles.routes.js";
import { profilesRepository } from "../modules/profiles/profiles.repository.js";
import { zonesRouter } from "../modules/zones/zones.routes.js";
import { requireAuthUserId } from "../modules/shared/auth-context.js";
import { createPreconditionRequiredError, toErrorResponse } from "../modules/shared/errors.js";
import { getProfileCompletion } from "../modules/shared/profile-completion.js";
import { ok } from "../utils/api-response.js";

const router = Router();

const requireCompletedProfileMiddleware = async (req, res, next) => {
  try {
    const userId = await requireAuthUserId(req);
    const profile = await profilesRepository.findByUserId(userId);
    const completion = getProfileCompletion(profile);
    if (!completion.isComplete) {
      throw createPreconditionRequiredError("Complete profile setup before using this endpoint", {
        missingFields: completion.missingFields,
      });
    }
    req.profile = profile;
    next();
  } catch (error) {
    const { statusCode, body } = toErrorResponse(error);
    return res.status(statusCode).json(body);
  }
};

router.get("/health/live", (_req, res) => {
  ok(
    res,
    {
      service: env.appName,
      status: "up",
      timestamp: new Date().toISOString(),
    },
    "Service healthy",
  );
});

router.get("/health/ready", (_req, res) => {
  ok(
    res,
    {
      ready: true,
      timestamp: new Date().toISOString(),
    },
    "Service ready",
  );
});

router.get("/health/metrics", (_req, res) => {
  ok(
    res,
    {
      timezone: env.timezone,
      mockOtpExposure: env.mockOtpExposure,
      rateLimit: {
        windowMs: env.rateLimitWindowMs,
        max: env.rateLimitMax,
      },
      auth: {
        supabaseEnabled: Boolean(env.supabaseUrl && env.supabaseAnonKey),
        jwtConfigured: Boolean((env.jwtSecret || process.env.JWT_SECRET || "").trim()),
        allowDemoAuthFallback: env.allowDemoAuthFallback,
      },
      otp: {
        twilioConfigured: Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioVerifyServiceSid),
        twilioVerifyServiceSidPrefix: (env.twilioVerifyServiceSid || "").slice(0, 2),
      },
      liveData: {
        strictLiveData: env.strictLiveData,
        openWeatherConfigured: Boolean(env.openWeatherApiKey),
        imdBaseUrl: env.imdBaseUrl,
        imdCapRssUrl: env.imdCapRssUrl,
        incoisBaseUrl: env.incoisBaseUrl,
      },
    },
    "Runtime settings snapshot",
  );
});

router.use("/auth", authRouter);
router.use("/profiles", profilesRouter);
router.use("/marine", requireCompletedProfileMiddleware, marineWeatherRouter);
router.use("/advisories", requireCompletedProfileMiddleware, advisoriesRouter);
router.use("/zones", zonesRouter);
router.use("/alerts", requireCompletedProfileMiddleware, alertsRouter);
router.use("/notices", requireCompletedProfileMiddleware, noticesRouter);
router.use("/emergency/sos", requireCompletedProfileMiddleware, emergencySosRouter);

export { router };
