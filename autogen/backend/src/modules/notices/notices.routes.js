import { Router } from "express";
import { createNotice, expireNotice, listNotices } from "./notices.controller.js";

export const noticesRouter = Router();

noticesRouter.get("/", listNotices);
noticesRouter.post("/", createNotice);
noticesRouter.patch("/:noticeId/expire", expireNotice);
