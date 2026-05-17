import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { decodeSessionCookie } from "@/lib/auth/session";

// Combined Proxy (Next 16 renamed `middleware` → `proxy`). Two responsibilities:
//   1. /profile/* — redirect unauthenticated visitors to /auth/otp.
//   2. Sprint 10B: attach X-Robots-Tag: noindex, nofollow, noarchive to every
//      response when the request is on the staging environment (host =
//      staging.zolaq.az OR env STAGING_NO_INDEX=true). See
//      docs/sprint-10/STAGING_NOINDEX_POLICY.md.

const STAGING_HOST = "staging.zolaq.az";
const NOINDEX_VALUE = "noindex, nofollow, noarchive";

function shouldNoIndex(request: NextRequest): boolean {
  if (process.env.STAGING_NO_INDEX === "true") return true;
  const host = request.headers.get("host") ?? "";
  return host === STAGING_HOST || host.startsWith(`${STAGING_HOST}:`);
}

function attachNoIndex(response: NextResponse, on: boolean): NextResponse {
  if (on) response.headers.set("X-Robots-Tag", NOINDEX_VALUE);
  return response;
}

export function proxy(request: NextRequest) {
  const noIndex = shouldNoIndex(request);

  // /profile/* auth gate (pre-existing behavior)
  if (request.nextUrl.pathname.startsWith("/profile")) {
    const cookie = request.cookies.get(SESSION_COOKIE);
    const session = cookie ? decodeSessionCookie(cookie.value) : null;
    if (session) {
      return attachNoIndex(NextResponse.next(), noIndex);
    }
    const url = new URL("/auth/otp", request.url);
    url.searchParams.set("purpose", "profile_access");
    url.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return attachNoIndex(NextResponse.redirect(url), noIndex);
  }

  // Default path: pass through, decorate with X-Robots-Tag on staging.
  return attachNoIndex(NextResponse.next(), noIndex);
}

export const config = {
  // Run on every request except Next internals and static assets. Profile
  // routes still match this broad pattern (the function dispatches by path).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
