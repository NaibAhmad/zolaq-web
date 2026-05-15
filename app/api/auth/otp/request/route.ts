import { NextRequest, NextResponse } from "next/server";
import { OTP, isOtpPurpose } from "@/lib/auth/constants";
import { errorJson } from "@/lib/auth/error";
import { normalizePhone, phoneHash } from "@/lib/auth/phone";
import { otpProvider } from "@/lib/auth/otp-provider";
import {
  checkRateLimit,
  createOtpSession,
  generateCode,
  recordRequest,
} from "@/lib/auth/otp-store";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Invalid JSON body.");
  }

  const { phone, purpose, lead_id } = (body ?? {}) as {
    phone?: unknown;
    purpose?: unknown;
    lead_id?: unknown;
  };

  if (typeof phone !== "string") {
    return errorJson(400, "VALIDATION_ERROR", "`phone` is required.");
  }
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return errorJson(400, "VALIDATION_ERROR", "Telefon nömrəsi formatı yanlışdır.", {
      field: "phone",
    });
  }
  if (!isOtpPurpose(purpose)) {
    return errorJson(400, "VALIDATION_ERROR", "`purpose` is invalid.", {
      field: "purpose",
    });
  }
  if (lead_id !== undefined && typeof lead_id !== "string") {
    return errorJson(400, "VALIDATION_ERROR", "`lead_id` must be a string.");
  }

  const hash = phoneHash(normalized);
  const rl = checkRateLimit(hash);
  if (!rl.allowed) {
    return errorJson(429, "RATE_LIMITED", "Saatlıq OTP limiti aşılıb.", {
      retry_after_seconds: rl.retryAfterSeconds ?? null,
    });
  }

  const code = generateCode();
  const session = createOtpSession({
    phoneHash: hash,
    purpose,
    code,
    leadId: lead_id,
  });
  recordRequest(hash);

  await otpProvider.sendCode({
    phone: normalized,
    phoneHash: hash,
    code,
    purpose,
  });

  return NextResponse.json({
    otp_session_id: session.id,
    expires_in_seconds: OTP.EXPIRY_SECONDS,
    resend_after_seconds: OTP.RESEND_COOLDOWN_SECONDS,
  });
}
