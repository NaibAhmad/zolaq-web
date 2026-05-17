import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/api-utils";
import { getInvoice } from "@/lib/invoices/store";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ invoiceId: string }> },
) {
  const auth = await requireAdmin(
    request,
    "super_admin",
    "internal_ops_admin",
    "sales_lead_manager",
  );
  if ("response" in auth) return auth.response;
  const { invoiceId } = await ctx.params;
  const inv = getInvoice(invoiceId);
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ invoice: inv });
}
