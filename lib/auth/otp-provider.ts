import { getSmsProvider } from "@/lib/sms";
import type { OtpPurpose } from "./constants";

// Sprint 9F: thin compatibility shim — existing callers import { otpProvider }
// from here. Delegates to the SMS provider layer (mock | http | disabled).
// `sendCode` throws on `disabled` so the OTP route can map to AUTH_NOT_AVAILABLE.

export interface OtpProvider {
  sendCode(input: {
    phone: string;
    phoneHash: string;
    code: string;
    purpose: OtpPurpose;
  }): Promise<void>;
}

export const otpProvider: OtpProvider = {
  async sendCode(input) {
    const sms = getSmsProvider();
    const result = await sms.sendOtp(input);
    if (!result.ok) {
      throw new SmsSendError(result.reason);
    }
  },
};

export class SmsSendError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(`sms_send_failed:${reason}`);
    this.name = "SmsSendError";
    this.reason = reason;
  }
}
