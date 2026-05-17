import type { SmsProvider, SendOtpInput, SendOtpResult } from "./provider";

// Sprint 9F: generic HTTP SMS adapter. Vendor-neutral — the body shape is
// described in docs/sprint-9f/SMS_PROVIDER_SETUP.md and is intentionally
// minimal so plugging in Twilio / SMSc / a local Azeri vendor only needs a
// thin wrapper above this. Never logs the OTP code or the raw phone number.

const DEFAULT_TIMEOUT_MS = 5_000;

type HttpProviderConfig = {
  url: string;
  apiKey: string;
  senderId: string;
  timeoutMs: number;
};

function readConfig(): HttpProviderConfig {
  const url = process.env.SMS_API_URL?.trim();
  const apiKey = process.env.SMS_API_KEY?.trim();
  const senderId = process.env.SMS_SENDER_ID?.trim();
  const timeoutRaw = process.env.SMS_TIMEOUT_MS?.trim();
  const timeoutMs = timeoutRaw ? Number.parseInt(timeoutRaw, 10) : DEFAULT_TIMEOUT_MS;

  if (!url || !apiKey || !senderId) {
    throw new Error(
      "[zolaq] HTTP SMS provider requires SMS_API_URL, SMS_API_KEY, and SMS_SENDER_ID.",
    );
  }
  return {
    url,
    apiKey,
    senderId,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
  };
}

function otpMessage(code: string, purpose: SendOtpInput["purpose"]): string {
  // Single neutral template — vendor receives only `phone`, `text`, `sender`.
  // No purpose-specific copy yet; localization lives in a future sprint.
  void purpose;
  return `Zolaq tesdiq kodu: ${code}`;
}

export function createHttpSmsProvider(): SmsProvider {
  const config = readConfig();
  return {
    name: "http",
    async sendOtp(input: SendOtpInput): Promise<SendOtpResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const res = await fetch(config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            sender: config.senderId,
            phone: input.phone,
            text: otpMessage(input.code, input.purpose),
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          return { ok: false, reason: `http_${res.status}` };
        }
        return { ok: true };
      } catch (err) {
        const reason =
          err instanceof Error && err.name === "AbortError" ? "timeout" : "network_error";
        return { ok: false, reason };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
