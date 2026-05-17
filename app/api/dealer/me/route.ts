import { NextResponse, type NextRequest } from "next/server";
import { getDealer } from "@/lib/admin";
import { requireDealer } from "@/lib/admin/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireDealer(request);
  if ("response" in auth) return auth.response;
  const dealer = getDealer(auth.session.dealerId);
  return NextResponse.json({ session: auth.session, dealer });
}
