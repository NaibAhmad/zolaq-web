import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { decodeSessionCookie } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE);
  const session = cookie ? decodeSessionCookie(cookie.value) : null;
  if (session) return NextResponse.next();

  const url = new URL("/auth/otp", request.url);
  url.searchParams.set("purpose", "profile_access");
  url.searchParams.set(
    "next",
    request.nextUrl.pathname + request.nextUrl.search
  );
  return NextResponse.redirect(url);
}

export const config = {
  matcher: "/profile/:path*",
};
