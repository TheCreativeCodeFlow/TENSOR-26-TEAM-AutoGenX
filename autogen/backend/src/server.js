import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const [{ app }, { env }, { logger }] = await Promise.all([
  import("./app.js"),
  import("./config/env.js"),
  import("./config/logger.js"),
]);

const server = http.createServer(app);

const shutdownSignals = ["SIGINT", "SIGTERM"];

function shutdown(signal) {
  logger.warn("server.shutdown.start", { signal });
  server.close((error) => {
    if (error) {
      logger.error("server.shutdown.failed", { signal, error: error.message });
      process.exit(1);
      return;
    }
    logger.info("server.shutdown.complete", { signal });
    process.exit(0);
  });
}

server.listen(env.port, () => {
  logger.info("server.started", {
    port: env.port,
    env: env.nodeEnv,
    apiPrefix: env.apiPrefix,
  });
});

shutdownSignals.forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

process.on("unhandledRejection", (reason) => {
  logger.error("process.unhandledRejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

process.on("uncaughtException", (error) => {
  logger.error("process.uncaughtException", { error: error.message });
  shutdown("uncaughtException");
});
