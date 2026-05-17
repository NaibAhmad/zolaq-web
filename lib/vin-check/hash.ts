import { createHash } from "node:crypto";
import { IS_PRODUCTION } from "@/lib/env";

// Sprint 9H: deterministic VIN hash for the future VinCheckRequest.vin_hash /
// VinCheckCache.vin_hash columns. Raw VIN must NEVER be persisted (R11.4).
// Mirrors the dev-fallback / prod-required pattern in lib/auth/phone.ts —
// kept as a separate salt so rotating one never affects the other.

const DEV_FALLBACK_SALT = "zolaq-dev-vin-salt";

export function vinHash(vin: string): string {
  const envSalt = process.env.VIN_HASH_SALT;
  if (IS_PRODUCTION && (!envSalt || envSalt.length === 0)) {
    throw new Error(
      "[zolaq] VIN_HASH_SALT is required in production. Generate one with " +
        "`openssl rand -base64 32` and set it before starting the server.",
    );
  }
  const salt = envSalt ?? DEV_FALLBACK_SALT;
  return createHash("sha256").update(`${salt}:${vin}`).digest("hex");
}
