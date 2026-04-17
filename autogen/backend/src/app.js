import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { buildCorsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.js";
import { notFoundMiddleware } from "./middleware/not-found.js";
import { apiRateLimiter } from "./middleware/rate-limit.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { requestLoggerMiddleware } from "./middleware/request-logger.js";
import { securityHeadersMiddleware } from "./middleware/security-headers.js";
import { router as apiRouter } from "./routes/index.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, "..");

const resolveApkFilePath = () => {
	const files = fs.readdirSync(backendRootDir, { withFileTypes: true });
	const apkFile = files.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".apk"));
	return apkFile ? path.join(backendRootDir, apkFile.name) : null;
};

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(securityHeadersMiddleware);
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: env.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.bodyLimit }));

app.get("/download/apk", (req, res) => {
	const apkPath = resolveApkFilePath();
	if (!apkPath) {
		return res.status(404).json({
			error: {
				code: "APK_NOT_FOUND",
				message: "APK file not found in backend root",
			},
		});
	}

	return res.download(apkPath, path.basename(apkPath));
});

app.use(env.apiPrefix, apiRateLimiter);
app.use(env.apiPrefix, apiRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export { app };
