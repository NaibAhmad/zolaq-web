import { createHash } from "node:crypto";
import { IS_PRODUCTION } from "@/lib/env";

const E164_RE = /^\+[1-9]\d{8,14}$/;

export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-()]/g, "");
  if (!E164_RE.test(cleaned)) return null;
  return cleaned;
}

const DEV_FALLBACK_SALT = "zolaq-dev-salt";

// Sprint 9E: in production, refuse to hash a phone if no real salt is set —
// the dev fallback is fine for local + CI but would let two prod instances
// derive the same hash from the same number, which weakens the
// "we never store raw phones" guarantee. Lazy (per-call) so module import at
// build time doesn't crash a prod build whose env vars aren't loaded yet.
export function phoneHash(phone: string): string {
  const envSalt = process.env.OTP_PHONE_HASH_SALT;
  if (IS_PRODUCTION && (!envSalt || envSalt.length === 0)) {
    throw new Error(
      "[zolaq] OTP_PHONE_HASH_SALT is required in production. Generate one " +
        "with `openssl rand -base64 32` and set it before starting the server.",
    );
  }
  const salt = envSalt ?? DEV_FALLBACK_SALT;
  return createHash("sha256").update(`${salt}:${phone}`).digest("hex");
}
