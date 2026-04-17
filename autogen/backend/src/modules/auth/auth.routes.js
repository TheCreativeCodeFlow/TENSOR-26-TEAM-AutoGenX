import { Router } from "express";
import { logout, me, sendOtp, verifyOtp } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/otp/request", sendOtp);
authRouter.post("/otp/verify", verifyOtp);
authRouter.get("/me", me);
authRouter.post("/logout", logout);
