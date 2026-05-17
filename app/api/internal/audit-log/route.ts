import { NextResponse, type NextRequest } from "next/server";
import { listAuditLog } from "@/lib/audit/repository";
import { requireAdmin } from "@/lib/admin/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 100);
  return NextResponse.json({
    entries: await listAuditLog({ limit: Number.isFinite(limit) ? limit : 100 }),
  });
}
