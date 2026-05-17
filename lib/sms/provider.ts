import type { OtpPurpose } from "@/lib/auth/constants";

// Sprint 9F: SMS provider abstraction. The OTP flow goes through `sendOtp`.
// Implementations: mock (dev), http (production vendor), disabled (refuses).
// Raw phone and OTP code MUST NOT be logged by any implementation.

export type SendOtpInput = {
  phone: string;
  phoneHash: string;
  code: string;
  purpose: OtpPurpose;
};

export type SendOtpResult =
  | { ok: true }
  | { ok: false; reason: string };

export interface SmsProvider {
  readonly name: string;
  sendOtp(input: SendOtpInput): Promise<SendOtpResult>;
}
