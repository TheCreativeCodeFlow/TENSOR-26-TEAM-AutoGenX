import { isProduction } from "./env.js";

function format(level, message, meta = {}) {
  return {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
}

function write(level, message, meta) {
  const payload = format(level, message, meta);
  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }
  if (!isProduction && level === "debug") {
    console.debug(JSON.stringify(payload));
    return;
  }
  console.log(JSON.stringify(payload));
}

export const logger = {
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
  debug: (message, meta) => write("debug", message, meta),
};
