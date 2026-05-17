// Sprint 9E: centralized env access for auth-related flags. Importing from
// here (instead of reading process.env at every call site) gives us one place
// to assert prod-safety and one place to swap defaults for tests.

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Mock admin/dealer role pickers and the matching /api/.../auth/login mock
// path are gated by this flag. A production deploy that forgets to set this
// will render a "Sign-in coming soon" placeholder and reject mock logins with
// 503 instead of silently exposing role selection to the public internet.
export const DEV_AUTH_MODE = process.env.DEV_AUTH_MODE === "true";

// Use at module-init time inside code paths that must never run in production
// without DEV_AUTH_MODE (mock login routes, mock role-picker fetchers).
export function assertDevAuthAllowed(label: string): void {
  if (!DEV_AUTH_MODE) {
    throw new Error(
      `[zolaq] ${label}: DEV_AUTH_MODE is not enabled. Set DEV_AUTH_MODE=true ` +
        "in your .env to use the mock auth flow, or wait for real auth (Sprint 9F).",
    );
  }
}

// Sprint 10D: client-readable beta flags. NEXT_PUBLIC_ prefix so the same
// constant resolves identically in server and client bundles. Default false —
// production stays dark; local dev opts in via .env.local.

export const FEATURE_VIN_BETA =
  (process.env.NEXT_PUBLIC_FEATURE_VIN_BETA ?? "false") === "true";

export const FEATURE_I18N_BETA =
  (process.env.NEXT_PUBLIC_FEATURE_I18N_BETA ?? "false") === "true";
