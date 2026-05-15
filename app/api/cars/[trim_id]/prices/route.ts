import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getPricesForTrim, getTrimById } from "@/lib/cars/lookup";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ trim_id: string }> }
) {
  const { trim_id } = await context.params;
  const trim = getTrimById(trim_id);
  if (!trim) {
    return errorJson(404, "NOT_FOUND", "Trim tapılmadı.", { trim_id });
  }
  return NextResponse.json({ prices: getPricesForTrim(trim_id) });
}
