import { NextResponse, type NextRequest } from "next/server";
import { requireDealerPermission } from "@/lib/admin/api-utils";
import { listSubmissions } from "@/lib/dealer/submissions/store";

export async function GET(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.submission.view_own");
  if ("response" in auth) return auth.response;
  return NextResponse.json({
    submissions: listSubmissions({ dealer_id: auth.session.dealerId }),
  });
}
