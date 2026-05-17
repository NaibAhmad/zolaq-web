#!/usr/bin/env node
// Sprint 10B — local/dev env safety scan.
//
// Goal: catch obvious unsafe combinations in any environment (local, CI, dev
// preview). NEVER prints secret values — only presence/value-of-non-secret
// booleans. Returns:
//   exit 0 — safe
//   exit 1 — at least one critical violation

const present = (k) => {
  const v = process.env[k];
  return typeof v === "string" && v.length > 0;
};

const isProdLike = () => {
  if (process.env.NODE_ENV === "production") return true;
  const v = process.env.VERCEL_ENV;
  return v === "production" || v === "preview";
};

const failures = [];
const warnings = [];

function fail(msg) {
  failures.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

// --- critical rules ---------------------------------------------------------
if (process.env.DEV_AUTH_MODE === "true" && isProdLike()) {
  fail("DEV_AUTH_MODE=true while NODE_ENV/VERCEL_ENV is production/preview");
}

if (isProdLike() && !present("AUTH_SESSION_SECRET")) {
  fail("AUTH_SESSION_SECRET is missing in a production-like environment");
}

if (isProdLike() && !present("OTP_PHONE_HASH_SALT")) {
  fail("OTP_PHONE_HASH_SALT is missing in a production-like environment");
}

if (isProdLike() && !present("VIN_HASH_SALT")) {
  fail("VIN_HASH_SALT is missing in a production-like environment");
}

// --- soft warnings ----------------------------------------------------------
if (!present("AUTH_SESSION_SECRET")) {
  warn("AUTH_SESSION_SECRET is unset — dev fallback in use (not safe for staging)");
}
if (!present("OTP_PHONE_HASH_SALT")) {
  warn("OTP_PHONE_HASH_SALT is unset — dev fallback in use (not safe for staging)");
}
if (!present("VIN_HASH_SALT")) {
  warn("VIN_HASH_SALT is unset — dev fallback in use (not safe for staging)");
}

const smsProvider = process.env.SMS_PROVIDER ?? "unset";
if (smsProvider === "mock") {
  warn("SMS_PROVIDER=mock — OTP codes log to server console; never run on production host");
} else if (smsProvider === "unset" || smsProvider === "disabled") {
  warn(`SMS_PROVIDER=${smsProvider} — OTP delivery is OFF`);
} else if (smsProvider === "http") {
  if (!present("SMS_API_URL")) fail("SMS_PROVIDER=http but SMS_API_URL is missing");
  if (!present("SMS_API_KEY")) fail("SMS_PROVIDER=http but SMS_API_KEY is missing");
  if (!present("SMS_SENDER_ID")) warn("SMS_PROVIDER=http but SMS_SENDER_ID is missing");
}

const mediaProvider = process.env.MEDIA_STORAGE_PROVIDER ?? "local";
if (mediaProvider === "local" && isProdLike()) {
  warn("MEDIA_STORAGE_PROVIDER=local on production-like host — files land on ephemeral fs");
}

// --- report ----------------------------------------------------------------
const summary = {
  environment: {
    NODE_ENV: process.env.NODE_ENV ?? "unset",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "unset",
    isProdLike: isProdLike(),
  },
  presence: {
    AUTH_SESSION_SECRET: present("AUTH_SESSION_SECRET"),
    OTP_PHONE_HASH_SALT: present("OTP_PHONE_HASH_SALT"),
    VIN_HASH_SALT: present("VIN_HASH_SALT"),
    DATABASE_URL: present("DATABASE_URL"),
    DIRECT_URL: present("DIRECT_URL"),
    STAGING_NO_INDEX: process.env.STAGING_NO_INDEX === "true",
  },
  config: {
    DEV_AUTH_MODE: process.env.DEV_AUTH_MODE === "true",
    SMS_PROVIDER: smsProvider,
    MEDIA_STORAGE_PROVIDER: mediaProvider,
  },
};

console.log("Sprint 10B env safety scan");
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
  process.exit(1);
}

console.log("\nOK — no critical env safety violations.");
process.exit(0);
