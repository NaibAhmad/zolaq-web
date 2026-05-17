import "server-only";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { isDatabaseAvailable } from "@/lib/db/availability";
import { prisma } from "@/lib/db/prisma";
import { IS_PRODUCTION } from "@/lib/env";
import { OTP, type OtpPurpose } from "./constants";

// Sprint 9F: OTP storage with two backends:
//   - DB-backed (Prisma OtpAttempt) when DATABASE_URL is usable.
//   - In-memory (globalThis Map) fallback for dev/local without a DB.
// The DB never stores the raw code — only an HMAC of it. The raw phone is
// never stored — only its salted hash via phoneHash() at the call site.

// ---------------------------------------------------------------------------
// Public types — code is intentionally NOT exposed.

export type OtpSessionMeta = {
  id: string;
  phoneHash: string;
  purpose: OtpPurpose;
  createdAt: number;
  expiresAt: number;
  resendAfter: number;
  attempts: number;
  maxAttempts: number;
  locked: boolean;
  verifiedAt?: number;
  leadId?: string;
};

// ---------------------------------------------------------------------------
// In-memory fallback stores.

type MemRow = OtpSessionMeta & { code: string };

type Stores = {
  otpSessions: Map<string, MemRow>;
  rateLimit: Map<string, number[]>;
};

const g = globalThis as unknown as { __zlq_auth_stores?: Stores };
const stores: Stores =
  g.__zlq_auth_stores ??
  (g.__zlq_auth_stores = {
    otpSessions: new Map(),
    rateLimit: new Map(),
  });

function now(): number {
  return Date.now();
}

function metaOf(row: MemRow): OtpSessionMeta {
  const { code: _unused, ...meta } = row;
  void _unused;
  return meta;
}

// ---------------------------------------------------------------------------
// Code utilities.

export function generateCode(): string {
  const buf = randomBytes(4);
  const n = buf.readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(OTP.CODE_LENGTH, "0");
}

function hmacCode(code: string): string {
  // Reuses the cookie HMAC key. We don't import getSecret() (private to
  // cookie-sign.ts) — duplicate the lookup here with the same fallback rules.
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length === 0) {
    if (IS_PRODUCTION) {
      throw new Error("[zolaq] AUTH_SESSION_SECRET required to hash OTP codes.");
    }
    return createHmac("sha256", "zolaq-dev-only-cookie-secret-do-not-use-in-prod")
      .update(code)
      .digest("base64url");
  }
  return createHmac("sha256", secret).update(code).digest("base64url");
}

function codeMatches(input: string, storedHash: string): boolean {
  const a = Buffer.from(hmacCode(input));
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Public API. All functions are async so callers can be DB-aware.

export async function checkRateLimit(phoneHash: string): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
}> {
  const windowMs = 60 * 60 * 1000;
  if (await isDatabaseAvailable()) {
    const since = new Date(now() - windowMs);
    const rows = await prisma.otpAttempt.findMany({
      where: { phone_hash: phoneHash, created_at: { gte: since } },
      select: { created_at: true },
      orderBy: { created_at: "asc" },
    });
    if (rows.length < OTP.RATE_LIMIT_PER_HOUR) return { allowed: true };
    const oldest = rows[0]?.created_at.getTime() ?? now();
    const retryAfterSeconds = Math.ceil((windowMs - (now() - oldest)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }
  const t = now();
  const arr = stores.rateLimit.get(phoneHash) ?? [];
  const fresh = arr.filter((ts) => t - ts < windowMs);
  stores.rateLimit.set(phoneHash, fresh);
  if (fresh.length < OTP.RATE_LIMIT_PER_HOUR) return { allowed: true };
  const oldest = Math.min(...fresh);
  return {
    allowed: false,
    retryAfterSeconds: Math.ceil((windowMs - (t - oldest)) / 1000),
  };
}

export async function createOtpSession(input: {
  phoneHash: string;
  purpose: OtpPurpose;
  code: string;
  leadId?: string;
}): Promise<OtpSessionMeta> {
  const id = `otp_${randomUUID()}`;
  const t = now();
  const meta: OtpSessionMeta = {
    id,
    phoneHash: input.phoneHash,
    purpose: input.purpose,
    createdAt: t,
    expiresAt: t + OTP.EXPIRY_SECONDS * 1000,
    resendAfter: t + OTP.RESEND_COOLDOWN_SECONDS * 1000,
    attempts: 0,
    maxAttempts: OTP.MAX_ATTEMPTS,
    locked: false,
    leadId: input.leadId,
  };
  if (await isDatabaseAvailable()) {
    await prisma.otpAttempt.create({
      data: {
        attempt_id: id,
        phone_hash: input.phoneHash,
        purpose: input.purpose,
        code_hash: hmacCode(input.code),
        attempt_count: 0,
        max_attempts: OTP.MAX_ATTEMPTS,
        expires_at: new Date(meta.expiresAt),
      },
    });
    return meta;
  }
  stores.otpSessions.set(id, { ...meta, code: input.code });
  return meta;
}

export async function recordRequest(phoneHash: string): Promise<void> {
  // DB-mode: createOtpSession already inserts a row; rate-limit uses that row.
  if (await isDatabaseAvailable()) return;
  const arr = stores.rateLimit.get(phoneHash) ?? [];
  arr.push(now());
  stores.rateLimit.set(phoneHash, arr);
}

export async function getOtpSession(id: string): Promise<OtpSessionMeta | null> {
  if (await isDatabaseAvailable()) {
    const row = await prisma.otpAttempt.findUnique({ where: { attempt_id: id } });
    if (!row) return null;
    return {
      id: row.attempt_id,
      phoneHash: row.phone_hash,
      purpose: row.purpose as OtpPurpose,
      createdAt: row.created_at.getTime(),
      expiresAt: row.expires_at.getTime(),
      resendAfter:
        row.created_at.getTime() + OTP.RESEND_COOLDOWN_SECONDS * 1000,
      attempts: row.attempt_count,
      maxAttempts: row.max_attempts,
      locked: row.locked_at != null,
      ...(row.verified_at && { verifiedAt: row.verified_at.getTime() }),
    };
  }
  const m = stores.otpSessions.get(id);
  return m ? metaOf(m) : null;
}

export type VerifyCodeResult =
  | { ok: true; session: OtpSessionMeta }
  | {
      ok: false;
      reason: "not_found" | "locked" | "expired" | "already_verified" | "invalid_code";
      session?: OtpSessionMeta;
      lockedNow?: boolean;
      attemptsRemaining?: number;
    };

export async function verifyCode(id: string, code: string): Promise<VerifyCodeResult> {
  if (await isDatabaseAvailable()) {
    const row = await prisma.otpAttempt.findUnique({ where: { attempt_id: id } });
    if (!row) return { ok: false, reason: "not_found" };
    const meta: OtpSessionMeta = {
      id: row.attempt_id,
      phoneHash: row.phone_hash,
      purpose: row.purpose as OtpPurpose,
      createdAt: row.created_at.getTime(),
      expiresAt: row.expires_at.getTime(),
      resendAfter: row.created_at.getTime() + OTP.RESEND_COOLDOWN_SECONDS * 1000,
      attempts: row.attempt_count,
      maxAttempts: row.max_attempts,
      locked: row.locked_at != null,
      ...(row.verified_at && { verifiedAt: row.verified_at.getTime() }),
    };
    if (meta.locked) return { ok: false, reason: "locked", session: meta };
    if (meta.verifiedAt) return { ok: false, reason: "already_verified", session: meta };
    if (now() > meta.expiresAt) {
      await prisma.otpAttempt.update({
        where: { attempt_id: id },
        data: { locked_at: new Date() },
      });
      return { ok: false, reason: "expired", session: { ...meta, locked: true } };
    }
    if (!codeMatches(code, row.code_hash)) {
      const nextAttempts = row.attempt_count + 1;
      const shouldLock = nextAttempts >= row.max_attempts;
      const updated = await prisma.otpAttempt.update({
        where: { attempt_id: id },
        data: {
          attempt_count: { increment: 1 },
          ...(shouldLock && { locked_at: new Date() }),
        },
      });
      return {
        ok: false,
        reason: "invalid_code",
        session: { ...meta, attempts: updated.attempt_count, locked: shouldLock },
        lockedNow: shouldLock,
        attemptsRemaining: Math.max(0, row.max_attempts - nextAttempts),
      };
    }
    const verifiedAt = new Date();
    await prisma.otpAttempt.update({
      where: { attempt_id: id },
      data: { verified_at: verifiedAt, consumed_at: verifiedAt },
    });
    return {
      ok: true,
      session: { ...meta, verifiedAt: verifiedAt.getTime() },
    };
  }

  // Memory path.
  const m = stores.otpSessions.get(id);
  if (!m) return { ok: false, reason: "not_found" };
  if (m.locked) return { ok: false, reason: "locked", session: metaOf(m) };
  if (m.verifiedAt) return { ok: false, reason: "already_verified", session: metaOf(m) };
  if (now() > m.expiresAt) {
    m.locked = true;
    return { ok: false, reason: "expired", session: metaOf(m) };
  }
  if (m.code !== code) {
    m.attempts += 1;
    const shouldLock = m.attempts >= m.maxAttempts;
    if (shouldLock) m.locked = true;
    return {
      ok: false,
      reason: "invalid_code",
      session: metaOf(m),
      lockedNow: shouldLock,
      attemptsRemaining: Math.max(0, m.maxAttempts - m.attempts),
    };
  }
  m.verifiedAt = now();
  return { ok: true, session: metaOf(m) };
}

export async function lockSession(id: string): Promise<void> {
  if (await isDatabaseAvailable()) {
    await prisma.otpAttempt
      .update({ where: { attempt_id: id }, data: { locked_at: new Date() } })
      .catch(() => undefined);
    return;
  }
  const s = stores.otpSessions.get(id);
  if (s) s.locked = true;
}

export function deriveUserId(phoneHash: string): string {
  return `user_${phoneHash.slice(0, 16)}`;
}
