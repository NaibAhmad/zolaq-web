import type { SmsProvider } from "./provider";
import { createHttpSmsProvider } from "./http-provider";
import { createMockSmsProvider } from "./mock-provider";

// Sprint 9F: SMS provider factory. Resolves once per process — callers should
// re-read via `getSmsProvider()` to pick up restart-only config changes.

type Mode = "mock" | "http" | "disabled";

function resolveMode(): Mode {
  const raw = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (raw === "mock" || raw === "http" || raw === "disabled") return raw;
  if (process.env.NODE_ENV === "production") return "disabled";
  return "mock";
}

function createDisabledProvider(): SmsProvider {
  return {
    name: "disabled",
    async sendOtp() {
      return { ok: false, reason: "disabled" };
    },
  };
}

const g = globalThis as unknown as { __zlq_sms_provider?: SmsProvider };

export function getSmsProvider(): SmsProvider {
  if (g.__zlq_sms_provider) return g.__zlq_sms_provider;
  const mode = resolveMode();
  let provider: SmsProvider;
  if (mode === "mock") {
    provider = createMockSmsProvider();
  } else if (mode === "http") {
    provider = createHttpSmsProvider();
  } else {
    provider = createDisabledProvider();
  }
  g.__zlq_sms_provider = provider;
  return provider;
}

// Test helper — never use in app code.
export function __resetSmsProviderCache(): void {
  delete g.__zlq_sms_provider;
}

export type { SmsProvider, SendOtpInput, SendOtpResult } from "./provider";
