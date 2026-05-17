import { NextResponse, type NextRequest } from "next/server";
import { listPrices } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  return NextResponse.json({ offers: listPrices({ offers_only: true }) });
}
