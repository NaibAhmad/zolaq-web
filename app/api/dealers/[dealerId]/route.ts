import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getDealerById } from "@/lib/dealers/lookup";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ dealerId: string }> }
) {
  const { dealerId } = await context.params;
  const dealer = getDealerById(dealerId);
  if (!dealer) {
    return errorJson(404, "NOT_FOUND", "Diler tapılmadı.", { dealerId });
  }
  return NextResponse.json({ dealer });
}
