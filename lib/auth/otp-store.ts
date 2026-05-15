import { randomBytes, randomUUID } from "node:crypto";
import { OTP, type OtpPurpose } from "./constants";

export type OtpSession = {
  id: string;
  phoneHash: string;
  purpose: OtpPurpose;
  code: string;
  createdAt: number;
  expiresAt: number;
  resendAfter: number;
  attempts: number;
  locked: boolean;
  verifiedAt?: number;
  leadId?: string;
};

type Stores = {
  otpSessions: Map<string, OtpSession>;
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

export function generateCode(): string {
  const buf = randomBytes(4);
  const n = buf.readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(OTP.CODE_LENGTH, "0");
}

export function createOtpSession(input: {
  phoneHash: string;
  purpose: OtpPurpose;
  code: string;
  leadId?: string;
}): OtpSession {
  const id = `otp_${randomUUID()}`;
  const t = now();
  const session: OtpSession = {
    id,
    phoneHash: input.phoneHash,
    purpose: input.purpose,
    code: input.code,
    createdAt: t,
    expiresAt: t + OTP.EXPIRY_SECONDS * 1000,
    resendAfter: t + OTP.RESEND_COOLDOWN_SECONDS * 1000,
    attempts: 0,
    locked: false,
    leadId: input.leadId,
  };
  stores.otpSessions.set(id, session);
  return session;
}

export function getOtpSession(id: string): OtpSession | null {
  return stores.otpSessions.get(id) ?? null;
}

export function incrementAttempts(id: string): {
  session: OtpSession;
  locked: boolean;
} | null {
  const s = stores.otpSessions.get(id);
  if (!s) return null;
  s.attempts += 1;
  if (s.attempts >= OTP.MAX_ATTEMPTS) s.locked = true;
  return { session: s, locked: s.locked };
}

export function markVerified(id: string): OtpSession | null {
  const s = stores.otpSessions.get(id);
  if (!s) return null;
  s.verifiedAt = now();
  return s;
}

export function lockSession(id: string): void {
  const s = stores.otpSessions.get(id);
  if (s) s.locked = true;
}

export function checkRateLimit(phoneHash: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const windowMs = 60 * 60 * 1000;
  const t = now();
  const arr = stores.rateLimit.get(phoneHash) ?? [];
  const fresh = arr.filter((ts) => t - ts < windowMs);
  stores.rateLimit.set(phoneHash, fresh);
  if (fresh.length < OTP.RATE_LIMIT_PER_HOUR) {
    return { allowed: true };
  }
  const oldest = Math.min(...fresh);
  const retryAfterSeconds = Math.ceil((windowMs - (t - oldest)) / 1000);
  return { allowed: false, retryAfterSeconds };
}

export function recordRequest(phoneHash: string): void {
  const arr = stores.rateLimit.get(phoneHash) ?? [];
  arr.push(now());
  stores.rateLimit.set(phoneHash, arr);
}

export function deriveUserId(phoneHash: string): string {
  return `user_${phoneHash.slice(0, 16)}`;
}
