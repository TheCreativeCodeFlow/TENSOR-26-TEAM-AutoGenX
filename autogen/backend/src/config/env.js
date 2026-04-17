function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function parseOrigins(value) {
  if (!value || value.trim() === "*") {
    return "*";
  }
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = Object.freeze({
  appName: process.env.APP_NAME ?? "fisherfolk-sea-safety-backend",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 3001),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  bodyLimit: process.env.BODY_LIMIT ?? "1mb",
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS ?? "*"),
  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: toNumber(process.env.RATE_LIMIT_MAX, 300),
  mockOtpExposure: toBoolean(process.env.MOCK_OTP_EXPOSURE, false),
  timezone: process.env.APP_TIMEZONE ?? "Asia/Kolkata",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseAuthTimeoutMs: toNumber(process.env.SUPABASE_AUTH_TIMEOUT_MS, 5000),
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID ?? "",
  twilioVerifyChannel: process.env.TWILIO_VERIFY_CHANNEL ?? "sms",
  allowDemoAuthFallback: toBoolean(process.env.ALLOW_DEMO_AUTH_FALLBACK, false),
  coastGuardNumber: process.env.COAST_GUARD_NUMBER ?? "1554",
  strictLiveData: toBoolean(process.env.STRICT_LIVE_DATA, true),
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY ?? "",
  openWeatherBaseUrl: process.env.OPENWEATHER_BASE_URL ?? "https://api.openweathermap.org",
  imdBaseUrl: process.env.IMD_BASE_URL ?? "https://mausam.imd.gov.in",
  imdCapRssUrl: process.env.IMD_CAP_RSS_URL ?? "https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml",
  incoisBaseUrl: process.env.INCOIS_BASE_URL ?? "https://incois.gov.in",
  incoisHighWaveUrl: process.env.INCOIS_HIGH_WAVE_URL ?? "https://incois.gov.in/site/services/hwa.jsp",
  incoisStormSurgeUrl: process.env.INCOIS_STORM_SURGE_URL ?? "https://incois.gov.in/site/services/StormSurge.jsp",
});

export const isProduction = env.nodeEnv === "production";
