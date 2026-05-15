import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getNewsBySlug } from "@/lib/content/lookup";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const article = getNewsBySlug(slug);
  if (!article) {
    return errorJson(404, "NOT_FOUND", "Xəbər tapılmadı.", { slug });
  }
  return NextResponse.json({ article });
}
