import { NextResponse, type NextRequest } from "next/server";
import { requireDealerPermission } from "@/lib/admin/api-utils";
import { listInvoices } from "@/lib/invoices/store";

export async function GET(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.invoice.view");
  if ("response" in auth) return auth.response;
  return NextResponse.json({
    invoices: listInvoices({ dealer_id: auth.session.dealerId }),
  });
}
