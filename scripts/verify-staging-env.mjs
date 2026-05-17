#!/usr/bin/env node
// Sprint 10B — stricter staging-only env verification.
//
// Intended to run against the Vercel Staging environment (or any env where
// `--staging` should be treated as production-like). Exit codes:
//   0 — ok (no failures, no warnings)
//   2 — ok with warnings (closed beta GO_WITH_LIMITATIONS path)
//   1 — failure (closed beta cannot start)
//
// NEVER prints secret values — only presence booleans and non-secret config.

const present = (k) => {
  const v = process.env[k];
  return typeof v === "string" && v.length > 0;
};

const failures = [];
const warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);

// --- HARD FAILS -------------------------------------------------------------
if (!present("DATABASE_URL")) fail("DATABASE_URL is missing");
if (!present("AUTH_SESSION_SECRET")) fail("AUTH_SESSION_SECRET is missing");
if (!present("OTP_PHONE_HASH_SALT")) fail("OTP_PHONE_HASH_SALT is missing");
if (!present("VIN_HASH_SALT")) fail("VIN_HASH_SALT is missing");
if (process.env.DEV_AUTH_MODE === "true") {
  fail("DEV_AUTH_MODE=true — staging must run with real password flow");
}

// DIRECT_URL is only required when DATABASE_URL routes through PgBouncer
// (Supabase pooled URL). We treat its absence as a warning unless the URL
// contains the pgbouncer marker.
if (present("DATABASE_URL") && /pgbouncer=true|:6543\b/.test(process.env.DATABASE_URL ?? "")) {
  if (!present("DIRECT_URL")) {
    fail("DATABASE_URL looks pooled (PgBouncer/Supabase) but DIRECT_URL is missing — migrations will fail");
  }
}

// --- WARNINGS ---------------------------------------------------------------
if (process.env.STAGING_NO_INDEX !== "true") {
  warn("STAGING_NO_INDEX is not true — staging will not emit deny-all robots/X-Robots-Tag");
}

const smsProvider = process.env.SMS_PROVIDER ?? "unset";
if (smsProvider === "mock") {
  warn("SMS_PROVIDER=mock — OTP codes are surfaced via server log only (accepted for closed beta cohort)");
} else if (smsProvider === "disabled" || smsProvider === "unset") {
  warn(`SMS_PROVIDER=${smsProvider} — OTP delivery is OFF`);
} else if (smsProvider === "http") {
  if (!present("SMS_API_URL")) fail("SMS_PROVIDER=http but SMS_API_URL is missing");
  if (!present("SMS_API_KEY")) fail("SMS_PROVIDER=http but SMS_API_KEY is missing");
  if (!present("SMS_SENDER_ID")) warn("SMS_PROVIDER=http but SMS_SENDER_ID is missing");
}

const mediaProvider = process.env.MEDIA_STORAGE_PROVIDER ?? "local";
if (mediaProvider === "local") {
  warn("MEDIA_STORAGE_PROVIDER=local — uploads land on Vercel ephemeral fs (accepted for closed beta)");
}
if (!present("MEDIA_PUBLIC_BASE_URL")) {
  warn("MEDIA_PUBLIC_BASE_URL is unset — falling back to /uploads");
}

// INITIAL_ADMIN_* only needed once for first bootstrap. Warn (not fail) so
// re-runs after bootstrap don't false-alarm.
const adminTriple = [
  present("INITIAL_ADMIN_EMAIL"),
  present("INITIAL_ADMIN_PASSWORD"),
  present("INITIAL_ADMIN_NAME"),
];
const adminAllPresent = adminTriple.every(Boolean);
const adminNonePresent = adminTriple.every((p) => !p);
if (!adminAllPresent && !adminNonePresent) {
  fail("INITIAL_ADMIN_EMAIL/PASSWORD/NAME — set all three or none (partial config will silently fail bootstrap)");
} else if (adminNonePresent) {
  warn("INITIAL_ADMIN_EMAIL/PASSWORD/NAME unset — only required for the first npm run bootstrap:admin");
}

// --- REPORT ----------------------------------------------------------------
const summary = {
  presence: {
    DATABASE_URL: present("DATABASE_URL"),
    DIRECT_URL: present("DIRECT_URL"),
    AUTH_SESSION_SECRET: present("AUTH_SESSION_SECRET"),
    OTP_PHONE_HASH_SALT: present("OTP_PHONE_HASH_SALT"),
    VIN_HASH_SALT: present("VIN_HASH_SALT"),
    INITIAL_ADMIN_TRIPLE: adminAllPresent ? "all" : adminNonePresent ? "none" : "partial",
  },
  config: {
    DEV_AUTH_MODE: process.env.DEV_AUTH_MODE === "true",
    STAGING_NO_INDEX: process.env.STAGING_NO_INDEX === "true",
    SMS_PROVIDER: smsProvider,
    MEDIA_STORAGE_PROVIDER: mediaProvider,
  },
};

console.log("Sprint 10B staging env verification");
console.log("─".repeat(48));
console.log(JSON.stringify(summary, null, 2));
console.log("─".repeat(48));

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
}
if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  for (const f of failures) console.log(`  FAIL  ${f}`);
  console.log("\nSTAGING_NOT_READY — fix failures before inviting closed beta testers.");
  process.exit(1);
}
if (warnings.length) {
  console.log("\nSTAGING_READY_WITH_WARNINGS — acceptable for closed beta GO_WITH_LIMITATIONS.");
  process.exit(2);
}
console.log("\nSTAGING_READY — no warnings, no failures.");
process.exit(0);
