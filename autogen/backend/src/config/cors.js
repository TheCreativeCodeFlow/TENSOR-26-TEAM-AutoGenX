import { env } from "./env.js";

export function buildCorsOptions() {
  if (env.corsOrigins === "*") {
    return { origin: true, credentials: true };
  }

  const allowList = new Set(env.corsOrigins);
  return {
    origin(origin, callback) {
      if (!origin || allowList.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  };
}
