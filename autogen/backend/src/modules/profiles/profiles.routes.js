import { Router } from "express";
import { getMyProfile, upsertMyProfile } from "./profiles.controller.js";

export const profilesRouter = Router();

profilesRouter.get("/me", getMyProfile);
profilesRouter.put("/me", upsertMyProfile);
