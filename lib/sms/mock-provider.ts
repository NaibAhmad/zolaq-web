import type { SmsProvider } from "./provider";

// Sprint 9F: mock SMS adapter for dev. Logs a `[MOCK-OTP]` line with the
// phoneHash prefix, purpose, and code. Never logs the raw phone number.
// Construction is refused in production (NODE_ENV=production) unless
// DEV_AUTH_MODE=true, so a misconfigured prod cannot silently fall back here.

export function createMockSmsProvider(): SmsProvider {
  if (process.env.NODE_ENV === "production" && process.env.DEV_AUTH_MODE !== "true") {
    throw new Error(
      "[zolaq] Mock SMS provider is not allowed in production. Set SMS_PROVIDER=http or SMS_PROVIDER=disabled.",
    );
  }
  return {
    name: "mock",
    async sendOtp({ phoneHash, code, purpose }) {
      console.log(
        `[MOCK-OTP] phoneHash=${phoneHash.slice(0, 12)}… purpose=${purpose} code=${code}`,
      );
      return { ok: true };
    },
  };
}
