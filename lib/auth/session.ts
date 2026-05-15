import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  type OtpPurpose,
} from "./constants";

export type Session = {
  userId: string;
  phoneHash: string;
  verifiedAt: number;
  exp: number;
  purpose: OtpPurpose;
};

// TODO Sprint pre-staging: sign this payload (JWT / signed cookie). Sprint 1
// uses base64 JSON because the mock has no real auth secret.
function encode(payload: Session): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decodeSessionCookie(value: string): Session | null {
  try {
    const json = Buffer.from(value, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Partial<Session>;
    if (
      !parsed ||
      typeof parsed.userId !== "string" ||
      typeof parsed.phoneHash !== "string" ||
      typeof parsed.verifiedAt !== "number" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.purpose !== "string"
    ) {
      return null;
    }
    if (parsed.exp < Date.now()) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const c = store.get(SESSION_COOKIE);
  if (!c) return null;
  return decodeSessionCookie(c.value);
}

export async function setSession(
  payload: Omit<Session, "exp">
): Promise<Session> {
  const session: Session = {
    ...payload,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: encode(session),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return session;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}
