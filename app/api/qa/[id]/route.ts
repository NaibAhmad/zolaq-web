import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getQAById } from "@/lib/content/lookup";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const qa = getQAById(id);
  if (!qa) {
    return errorJson(404, "NOT_FOUND", "Sual tapılmadı.", { id });
  }
  return NextResponse.json({ qa });
}
