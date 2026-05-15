import type { OtpProvider } from "./otp-provider";

// Mock provider for Sprint 1. Logs the generated code to the server console
// so a developer can complete the flow without an SMS gateway. Raw phone is
// never logged — only phone_hash + purpose, per OTP_FLOW_SPEC privacy rules.
export const mockOtpProvider: OtpProvider = {
  async sendCode({ phoneHash, code, purpose }) {
    // eslint-disable-next-line no-console
    console.log(
      `[MOCK-OTP] phoneHash=${phoneHash.slice(0, 12)}… purpose=${purpose} code=${code}`
    );
  },
};
