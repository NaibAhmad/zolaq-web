import { NextRequest, NextResponse } from "next/server";
import { OTP } from "@/lib/auth/constants";
import { errorJson } from "@/lib/auth/error";
import {
  deriveUserId,
  getOtpSession,
  incrementAttempts,
  lockSession,
  markVerified,
} from "@/lib/auth/otp-store";
import { setSession } from "@/lib/auth/session";

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
      "`otp_session_id` və `code` tələb olunur."
    );
  }

  const session = getOtpSession(otp_session_id);
  if (!session) {
    return errorJson(404, "NOT_FOUND", "OTP sessiyası tapılmadı.");
  }
  if (session.locked) {
    return errorJson(400, "LOCKED", "Bu sessiya bloklanıb.", {
      reason: "max_attempts",
    });
  }
  if (Date.now() > session.expiresAt) {
    lockSession(session.id);
    return errorJson(400, "EXPIRED", "Kodun müddəti bitib.", {
      reason: "expired",
    });
  }
  if (session.verifiedAt) {
    return errorJson(400, "LOCKED", "Sessiya artıq təsdiqlənib.", {
      reason: "already_verified",
    });
  }

  if (code !== session.code) {
    const r = incrementAttempts(session.id);
    if (r?.locked) {
      return errorJson(400, "LOCKED", "Maksimum cəhd sayına çatdı.", {
        reason: "max_attempts",
      });
    }
    const attemptsRemaining = OTP.MAX_ATTEMPTS - (r?.session.attempts ?? 0);
    return NextResponse.json(
      { verified: false, attempts_remaining: Math.max(0, attemptsRemaining) },
      { status: 400 }
    );
  }

  const verified = markVerified(session.id);
  if (!verified) {
    return errorJson(404, "NOT_FOUND", "OTP sessiyası tapılmadı.");
  }
  const userId = deriveUserId(verified.phoneHash);
  await setSession({
    userId,
    phoneHash: verified.phoneHash,
    verifiedAt: verified.verifiedAt ?? Date.now(),
    purpose: verified.purpose,
  });

  return NextResponse.json({
    verified: true,
    user_id: userId,
    lead_id: verified.leadId,
  });
}
