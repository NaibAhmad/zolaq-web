// Sprint 9F: password hashing helper for admin and dealer login.
// Uses Node's built-in scrypt (RFC 7914) — no native or pure-JS dependency.
//
// Stored format: scrypt$N=<n>$r=<r>$p=<p>$<saltB64>$<hashB64>
// Defaults: N=2^15, r=8, p=1, 16-byte salt, 64-byte derived key.
// Plaintext passwords are never logged.

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

const DEFAULT_N = 1 << 15;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;
const PREFIX = "scrypt";

function toB64(buf: Buffer): string {
  return buf.toString("base64");
}

function fromB64(s: string): Buffer {
  return Buffer.from(s, "base64");
}

export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new Error("hashPassword: empty password");
  }
  const salt = randomBytes(SALT_LEN);
  const derived = await scrypt(plain, salt, KEY_LEN, {
    N: DEFAULT_N,
    r: DEFAULT_R,
    p: DEFAULT_P,
  });
  return `${PREFIX}$N=${DEFAULT_N}$r=${DEFAULT_R}$p=${DEFAULT_P}$${toB64(salt)}$${toB64(derived)}`;
}

export function isPasswordHash(stored: string | null | undefined): boolean {
  if (typeof stored !== "string" || stored.length === 0) return false;
  return stored.startsWith(`${PREFIX}$`);
}

export async function verifyPassword(
  plain: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!isPasswordHash(stored)) return false;
  if (typeof plain !== "string" || plain.length === 0) return false;

  const parts = (stored as string).split("$");
  // [scrypt, N=..., r=..., p=..., saltB64, hashB64]
  if (parts.length !== 6 || parts[0] !== PREFIX) return false;

  const N = parseParam(parts[1], "N");
  const r = parseParam(parts[2], "r");
  const p = parseParam(parts[3], "p");
  if (!N || !r || !p) return false;

  const salt = fromB64(parts[4]);
  const expected = fromB64(parts[5]);
  if (expected.length === 0) return false;

  let derived: Buffer;
  try {
    derived = await scrypt(plain, salt, expected.length, { N, r, p });
  } catch {
    return false;
  }
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function parseParam(seg: string, key: string): number | null {
  const prefix = `${key}=`;
  if (!seg.startsWith(prefix)) return null;
  const n = Number.parseInt(seg.slice(prefix.length), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
