import { NextRequest, NextResponse } from "next/server";
import { writeAuditFireAndForget } from "@/lib/audit/repository";
import { errorJson } from "@/lib/auth/error";
import { deriveUserId, verifyCode } from "@/lib/auth/otp-store";
import { setSession } from "@/lib/auth/session";

type OtpAuditAction = "otp.verified" | "otp.failed" | "otp.expired" | "otp.locked";

// See request/route.ts: actor_type=system + truncated phone hash so the
// audit row never contains a raw phone number.
function safeAudit(action: OtpAuditAction, hash: string, purpose: string, note?: string): void {
  try {
    writeAuditFireAndForget({
      actor_type: "system",
      actor_id: hash.slice(0, 16),
      role: "customer",
      action,
      entity_type: "otp",
      entity_id: hash.slice(0, 16),
      note: note ? `${purpose}; ${note}` : purpose,
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

  const { otp_session_id, code } = (body ?? {}) as {
    otp_session_id?: unknown;
    code?: unknown;
  };

  if (typeof otp_session_id !== "string" || typeof code !== "string") {
    return errorJson(
      400,
      "VALIDATION_ERROR",
      "`otp_session_id` və `code` tələb olunur.",
    );
  }

  const result = await verifyCode(otp_session_id, code);

  if (!result.ok) {
    const s = result.session;
    if (result.reason === "not_found") {
      return errorJson(404, "NOT_FOUND", "OTP sessiyası tapılmadı.");
    }
    if (result.reason === "locked") {
      if (s) safeAudit("otp.locked", s.phoneHash, s.purpose, "already_locked");
      return errorJson(400, "LOCKED", "Bu sessiya bloklanıb.", {
        reason: "max_attempts",
      });
    }
    if (result.reason === "expired") {
      if (s) safeAudit("otp.expired", s.phoneHash, s.purpose);
      return errorJson(400, "EXPIRED", "Kodun müddəti bitib.", {
        reason: "expired",
      });
    }
    if (result.reason === "already_verified") {
      return errorJson(400, "LOCKED", "Sessiya artıq təsdiqlənib.", {
        reason: "already_verified",
      });
    }
    // invalid_code
    if (s && result.lockedNow) {
      safeAudit("otp.locked", s.phoneHash, s.purpose, "max_attempts");
      return errorJson(400, "LOCKED", "Maksimum cəhd sayına çatdı.", {
        reason: "max_attempts",
      });
    }
    if (s) safeAudit("otp.failed", s.phoneHash, s.purpose);
    return NextResponse.json(
      { verified: false, attempts_remaining: result.attemptsRemaining ?? 0 },
      { status: 400 },
    );
  }

  const verified = result.session;
  const userId = deriveUserId(verified.phoneHash);
  await setSession({
    userId,
    phoneHash: verified.phoneHash,
    verifiedAt: verified.verifiedAt ?? Date.now(),
    purpose: verified.purpose,
  });

  safeAudit("otp.verified", verified.phoneHash, verified.purpose);

  return NextResponse.json({
    verified: true,
    user_id: userId,
    lead_id: verified.leadId,
  });
}
