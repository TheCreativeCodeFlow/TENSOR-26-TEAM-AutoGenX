import { authRepository } from "./auth.repository.js";
import { createUnauthorizedError, createValidationError } from "../shared/errors.js";
import { signAccessToken } from "../shared/jwt.js";
import { twilioVerifyProvider } from "../shared/twilio-verify.provider.js";

export const authService = {
  async sendOtp({ phone }) {
    await authRepository.assertReady();
    const delivery = await twilioVerifyProvider.sendOtp(phone);
    return {
      success: true,
      deliveryChannel: delivery.channel,
      status: delivery.status,
      phone,
    };
  },
  async verifyOtp({ phone, otp }) {
    const verification = await twilioVerifyProvider.verifyOtp(phone, otp);
    if (!verification.approved) {
      throw createUnauthorizedError("OTP verification failed");
    }

    let user = await authRepository.findUserByPhone(phone);
    const isNewUser = !user;
    if (!user) user = await authRepository.createUser({ phone });
    else user = (await authRepository.touchUser(user.id)) || user;

    if (!user?.id) {
      throw createValidationError("Could not establish user identity after OTP verification.");
    }

    const accessToken = signAccessToken(user);

    return {
      success: true,
      isNewUser,
      accessToken,
      user
    };
  },
  async getMe(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw createUnauthorizedError("User not found");
    return { user };
  },
  logout() {
    return { success: true };
  }
};
