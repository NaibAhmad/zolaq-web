import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db/availability";
import { DEV_AUTH_MODE, IS_PRODUCTION } from "@/lib/env";

// Sprint 9I: unauthenticated health endpoint. Returns presence-only signals —
// never the actual secret values. Safe to call from uptime monitoring every
// 60s. Status flips to "degraded" when a production environment is missing a
// requirement that would compromise auth/PII guarantees.

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CheckReport = {
  status: "ok" | "degraded";
  version: string;
  timestamp: string;
  environment: "production" | "development";
  devAuthMode: boolean;
  checks: {
    database: { available: boolean };
    auth: { sessionSecretConfigured: boolean };
    otp: { phoneSaltConfigured: boolean };
    vinCheck: { hashSaltConfigured: boolean };
    media: { provider: string; baseUrl: string };
    sms: { provider: string; configured: boolean };
  };
};

export async function GET(): Promise<NextResponse<CheckReport>> {
  const database = { available: await isDatabaseAvailable() };
  const auth = { sessionSecretConfigured: !!process.env.AUTH_SESSION_SECRET };
  const otp = { phoneSaltConfigured: !!process.env.OTP_PHONE_HASH_SALT };
  const vinCheck = { hashSaltConfigured: !!process.env.VIN_HASH_SALT };
  const media = {
    provider: process.env.MEDIA_STORAGE_PROVIDER ?? "local",
    baseUrl: process.env.MEDIA_PUBLIC_BASE_URL ?? "/uploads",
  };
  const smsProvider = process.env.SMS_PROVIDER ?? "unset";
  const sms = {
    provider: smsProvider,
    configured:
      smsProvider === "mock" ||
      smsProvider === "disabled" ||
      (smsProvider !== "unset" && !!process.env.SMS_API_URL && !!process.env.SMS_API_KEY),
  };

  const degraded =
    IS_PRODUCTION &&
    (!database.available ||
      !auth.sessionSecretConfigured ||
      !otp.phoneSaltConfigured ||
      DEV_AUTH_MODE ||
      sms.provider === "mock" ||
      sms.provider === "unset");

  const body: CheckReport = {
    status: degraded ? "degraded" : "ok",
    version: process.env.npm_package_version ?? "unknown",
    timestamp: new Date().toISOString(),
    environment: IS_PRODUCTION ? "production" : "development",
    devAuthMode: DEV_AUTH_MODE,
    checks: { database, auth, otp, vinCheck, media, sms },
  };

  return NextResponse.json(body, {
    status: degraded ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
