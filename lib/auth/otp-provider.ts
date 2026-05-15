import type { OtpPurpose } from "./constants";
import { mockOtpProvider } from "./mock-otp-provider";

export interface OtpProvider {
  sendCode(input: {
    phone: string;
    phoneHash: string;
    code: string;
    purpose: OtpPurpose;
  }): Promise<void>;
}

// Single import point for callers. Swap the implementation here when a real
// SMS adapter lands (Sprint pre-staging) without touching API routes.
export const otpProvider: OtpProvider = mockOtpProvider;
