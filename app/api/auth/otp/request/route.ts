import { NextRequest, NextResponse } from "next/server";
import { writeAuditFireAndForget } from "@/lib/audit/repository";
import { OTP, isOtpPurpose } from "@/lib/auth/constants";
import { errorJson } from "@/lib/auth/error";
import { normalizePhone, phoneHash } from "@/lib/auth/phone";
import { otpProvider, SmsSendError } from "@/lib/auth/otp-provider";
import {
  checkRateLimit,
  createOtpSession,
  generateCode,
  recordRequest,
} from "@/lib/auth/otp-store";

// Sprint 9E: customer-side OTP events are audited under actor_type=system
// (we have no authenticated customer yet at request time) and actor_id is the
// truncated phone hash so the log never contains a raw phone number.
function safeAudit(action: "otp.requested" | "otp.rate_limited", hash: string, purpose: string): void {
  try {
    writeAuditFireAndForget({
      actor_type: "system",
      actor_id: hash.slice(0, 16),
      role: "customer",
      action,
      entity_type: "otp",
      entity_id: hash.slice(0, 16),
      note: purpose,
    });
  } catch {
    // never fail the response on audit error
  }
}

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
  const rl = await checkRateLimit(hash);
  if (!rl.allowed) {
    safeAudit("otp.rate_limited", hash, purpose);
    return errorJson(429, "RATE_LIMITED", "Saatlıq OTP limiti aşılıb.", {
      retry_after_seconds: rl.retryAfterSeconds ?? null,
    });
  }

  const code = generateCode();
  const session = await createOtpSession({
    phoneHash: hash,
    purpose,
    code,
    leadId: lead_id,
  });
  await recordRequest(hash);

  try {
    await otpProvider.sendCode({
      phone: normalized,
      phoneHash: hash,
      code,
      purpose,
    });
  } catch (err) {
    if (err instanceof SmsSendError) {
      return errorJson(
        503,
        "AUTH_NOT_AVAILABLE",
        "SMS xidməti hazırda əlçatan deyil.",
      );
    }
    throw err;
  }

  safeAudit("otp.requested", hash, purpose);

  return NextResponse.json({
    otp_session_id: session.id,
    expires_in_seconds: OTP.EXPIRY_SECONDS,
    resend_after_seconds: OTP.RESEND_COOLDOWN_SECONDS,
  });
}
