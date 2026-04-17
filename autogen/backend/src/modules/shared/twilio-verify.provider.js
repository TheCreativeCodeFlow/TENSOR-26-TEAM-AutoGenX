import twilio from "twilio";
import { env } from "../../config/env.js";
import { createValidationError } from "./errors.js";

let client = null;

const ensureTwilioConfig = () => {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioVerifyServiceSid) {
    throw createValidationError(
      "Twilio Verify is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID.",
    );
  }

  if (!String(env.twilioVerifyServiceSid).startsWith("VA")) {
    throw createValidationError(
      "TWILIO_VERIFY_SERVICE_SID must be a Twilio Verify Service SID starting with 'VA'. You likely used a Messaging Service SID (starts with 'MG').",
    );
  }
};

const getClient = () => {
  ensureTwilioConfig();
  if (!client) {
    client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  }
  return client;
};

export const twilioVerifyProvider = {
  async sendOtp(phone) {
    const verification = await getClient()
      .verify.v2.services(env.twilioVerifyServiceSid)
      .verifications.create({ to: phone, channel: env.twilioVerifyChannel });

    return {
      sid: verification.sid,
      status: verification.status,
      channel: verification.channel,
      to: verification.to,
    };
  },

  async verifyOtp(phone, otp) {
    const check = await getClient()
      .verify.v2.services(env.twilioVerifyServiceSid)
      .verificationChecks.create({ to: phone, code: otp });

    return {
      approved: check.status === "approved",
      status: check.status,
      to: check.to,
    };
  },
};
