import { NextResponse, type NextRequest } from "next/server";
import { requireDealerPermission } from "@/lib/admin/api-utils";
import { getInvoiceForDealer } from "@/lib/invoices/store";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ invoiceId: string }> },
) {
  const auth = await requireDealerPermission(request, "dealer.invoice.view");
  if ("response" in auth) return auth.response;
  const { invoiceId } = await ctx.params;
  const inv = getInvoiceForDealer(invoiceId, auth.session.dealerId);
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ invoice: inv });
}
