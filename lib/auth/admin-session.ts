// Sprint 8A: mock admin session. Mirrors lib/auth/session.ts (base64 JSON cookie)
// but lives on a separate cookie so customer + admin sessions never collide.
// TODO Sprint 8E: swap in real auth (password / SSO / signed JWT).

import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  isAdminRole,
  type AdminRole,
} from "./constants";
import { signPayload, tryDecodeLegacyCookie, verifySigned } from "./cookie-sign";

export type AdminSession = {
  adminId: string;
  name: string;
  role: AdminRole;
  sessionId?: string;
  exp: number;
};

function encode(payload: AdminSession): string {
  return signPayload(JSON.stringify(payload));
}

function parseJsonAsAdminSession(json: string): AdminSession | null {
  try {
    const parsed = JSON.parse(json) as Partial<AdminSession>;
    if (
      !parsed ||
      typeof parsed.adminId !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.exp !== "number" ||
      !isAdminRole(parsed.role)
    ) {
      return null;
    }
    if (parsed.exp < Date.now()) return null;
    return {
      adminId: parsed.adminId,
      name: parsed.name,
      role: parsed.role,
      ...(typeof parsed.sessionId === "string" && { sessionId: parsed.sessionId }),
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function decodeAdminCookie(value: string): AdminSession | null {
  const signed = verifySigned(value);
  if (signed !== null) return parseJsonAsAdminSession(signed);
  const legacy = tryDecodeLegacyCookie(value);
  if (legacy !== null) return parseJsonAsAdminSession(legacy);
  return null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const c = store.get(ADMIN_SESSION_COOKIE);
  if (!c) return null;
  return decodeAdminCookie(c.value);
}

export async function setAdminSession(
  payload: Omit<AdminSession, "exp">,
): Promise<AdminSession> {
  const session: AdminSession = {
    ...payload,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const store = await cookies();
  store.set({
    name: ADMIN_SESSION_COOKIE,
    value: encode(session),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return session;
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// Returns the session if present AND the role is in `allowedRoles` (or
// allowedRoles is omitted). Returns null otherwise — callers decide whether to
// redirect (layouts) or return 401/403 (API routes).
export async function getAdminWithRole(
  ...allowedRoles: readonly AdminRole[]
): Promise<AdminSession | null> {
  const session = await getAdminSession();
  if (!session) return null;
  if (allowedRoles.length === 0) return session;
  return allowedRoles.includes(session.role) ? session : null;
}
