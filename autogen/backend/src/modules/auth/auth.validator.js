import { assert, assertPhone, assertRequired } from "../shared/validate.js";

export const validateSendOtpInput = (body) => {
  assertRequired(body, ["phone"]);
  return { phone: assertPhone(body.phone) };
};

export const validateVerifyOtpInput = (body) => {
  assertRequired(body, ["phone", "otp"]);
  const phone = assertPhone(body.phone);
  const otp = String(body.otp).trim();
  assert(/^\d{6}$/.test(otp), "OTP must be 6 digits");
  return { phone, otp };
};
