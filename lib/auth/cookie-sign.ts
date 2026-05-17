import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { DEV_AUTH_MODE, IS_PRODUCTION } from "@/lib/env";

// Sprint 9E: HMAC-SHA256 signing for all session cookies (customer / admin /
// dealer). Format: <base64url(json)>.<base64url(hmac)>. Used to detect cookie
// tampering — without the secret, callers cannot mint a valid signature, so
// edited cookies (e.g. flipping role to super_admin) get rejected on decode.

const DEV_FALLBACK_SECRET = "zolaq-dev-only-cookie-secret-do-not-use-in-prod";

let warnedAboutDevSecret = false;

function getSecret(): string {
  const fromEnv = process.env.AUTH_SESSION_SECRET;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (IS_PRODUCTION) {
    throw new Error(
      "[zolaq] AUTH_SESSION_SECRET is required in production. Generate one " +
        "with `openssl rand -base64 48` and set it before starting the server.",
    );
  }
  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn(
      "[zolaq] AUTH_SESSION_SECRET is unset — using a fixed dev fallback. " +
        "Set AUTH_SESSION_SECRET in .env before deploying.",
    );
  }
  return DEV_FALLBACK_SECRET;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function b64urlDecode(s: string): Buffer | null {
  try {
    return Buffer.from(s, "base64url");
  } catch {
    return null;
  }
}

export function signPayload(json: string): string {
  const secret = getSecret();
  const payload = b64urlEncode(Buffer.from(json, "utf8"));
  const mac = createHmac("sha256", secret).update(payload).digest();
  return `${payload}.${b64urlEncode(mac)}`;
}

export function verifySigned(token: string): string | null {
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSecret()).update(payload).digest();
  const provided = b64urlDecode(sig);
  if (!provided || provided.length !== expected.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;
  const json = b64urlDecode(payload);
  return json ? json.toString("utf8") : null;
}

// Sprint 9E cutover helper: when DEV_AUTH_MODE is on, accept the legacy
// base64-JSON cookies for one cycle so devs aren't kicked out the moment the
// signing change lands. Production decode is signed-only.
export function tryDecodeLegacyCookie(value: string): string | null {
  if (!DEV_AUTH_MODE) return null;
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}
