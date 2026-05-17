// Sprint 8A: mock dealer session. Scoped to a single dealer_id so every
// dealer-facing read filters by `session.dealerId` and dealers cannot see each
// other. Separate cookie from customer + admin sessions.
// TODO Sprint 8E: swap in real auth.

import { cookies } from "next/headers";
import {
  DEALER_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  isDealerRole,
  type DealerRole,
} from "./constants";
import { signPayload, tryDecodeLegacyCookie, verifySigned } from "./cookie-sign";

export type DealerSession = {
  dealerId: string;
  contactName: string;
  role: DealerRole;
  dealerUserId?: string;
  sessionId?: string;
  exp: number;
};

function encode(payload: DealerSession): string {
  return signPayload(JSON.stringify(payload));
}

function parseJsonAsDealerSession(json: string): DealerSession | null {
  try {
    const parsed = JSON.parse(json) as Partial<DealerSession>;
    if (
      !parsed ||
      typeof parsed.dealerId !== "string" ||
      typeof parsed.contactName !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (parsed.exp < Date.now()) return null;
    // Legacy sessions (pre-9E) have no role field — default to "owner" so
    // existing dev sessions keep working through the cutover.
    const role: DealerRole = isDealerRole(parsed.role) ? parsed.role : "owner";
    return {
      dealerId: parsed.dealerId,
      contactName: parsed.contactName,
      role,
      ...(typeof parsed.dealerUserId === "string" && {
        dealerUserId: parsed.dealerUserId,
      }),
      ...(typeof parsed.sessionId === "string" && {
        sessionId: parsed.sessionId,
      }),
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function decodeDealerCookie(value: string): DealerSession | null {
  const signed = verifySigned(value);
  if (signed !== null) return parseJsonAsDealerSession(signed);
  const legacy = tryDecodeLegacyCookie(value);
  if (legacy !== null) return parseJsonAsDealerSession(legacy);
  return null;
}

export async function getDealerSession(): Promise<DealerSession | null> {
  const store = await cookies();
  const c = store.get(DEALER_SESSION_COOKIE);
  if (!c) return null;
  return decodeDealerCookie(c.value);
}

export async function setDealerSession(
  payload: Omit<DealerSession, "exp">,
): Promise<DealerSession> {
  const session: DealerSession = {
    ...payload,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const store = await cookies();
  store.set({
    name: DEALER_SESSION_COOKIE,
    value: encode(session),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return session;
}

export async function clearDealerSession(): Promise<void> {
  const store = await cookies();
  store.set({
    name: DEALER_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
