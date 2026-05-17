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

// Sprint 8A: private admin/dealer panels use separate cookies so the customer
// OTP session (above) and the internal sessions never co-mingle. Same TTL.
// TODO Sprint 8E: replace mock cookies with real auth (password/SSO/JWT).
export const ADMIN_SESSION_COOKIE = "zlq_admin_session";
export const DEALER_SESSION_COOKIE = "zlq_dealer_session";

export const ADMIN_ROLES = [
  "super_admin",
  "internal_ops_admin",
  "content_manager",
  "sales_lead_manager",
  "moderator",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

// Sprint 9E: dealer-side roles. Owner can do everything within the dealer's
// scope; manager handles offers/leads/media but not billing; staff is
// view-mostly. Enforcement points are gradual — Sprint 9F wires real
// password auth and per-action checks. The mock login defaults to "owner".
export const DEALER_ROLES = ["owner", "manager", "staff"] as const;

export type DealerRole = (typeof DEALER_ROLES)[number];

export function isDealerRole(value: unknown): value is DealerRole {
  return (
    typeof value === "string" &&
    (DEALER_ROLES as readonly string[]).includes(value)
  );
}
