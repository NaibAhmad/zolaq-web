import { NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  return NextResponse.json({
    user_id: session.userId,
    phone_hash: session.phoneHash,
    verified_at: session.verifiedAt,
    purpose: session.purpose,
  });
}
