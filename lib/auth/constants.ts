// Mock OTP rules — sourced from docs/reference Step 6 v2 OTP_FLOW_SPEC.md.
// These constants are the single source of truth; UI labels and server checks
// must read from here, not duplicate the values.

export const OTP = {
  CODE_LENGTH: 6,
  EXPIRY_SECONDS: 300,
  RESEND_COOLDOWN_SECONDS: 60,
  MAX_ATTEMPTS: 3,
  RATE_LIMIT_PER_HOUR: 3,
  // TODO Sprint 3: enforce unverified-draft-lead expiry against this value
  // when the lead lifecycle lands.
  DRAFT_LEAD_EXPIRY_SECONDS: 86_400,
} as const;

export const OTP_PURPOSES = [
  "lead_submit",
  "whatsapp_handoff",
  "profile_access",
] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export function isOtpPurpose(value: unknown): value is OtpPurpose {
  return (
    typeof value === "string" &&
    (OTP_PURPOSES as readonly string[]).includes(value)
  );
}

export const SESSION_COOKIE = "zlq_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
