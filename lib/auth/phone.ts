import { createHash } from "node:crypto";

const E164_RE = /^\+[1-9]\d{8,14}$/;

export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-()]/g, "");
  if (!E164_RE.test(cleaned)) return null;
  return cleaned;
}

export function phoneHash(phone: string): string {
  const salt = process.env.OTP_PHONE_HASH_SALT ?? "zolaq-dev-salt";
  return createHash("sha256").update(`${salt}:${phone}`).digest("hex");
}
