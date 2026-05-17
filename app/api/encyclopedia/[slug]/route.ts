import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getEncyclopediaBySlug } from "@/lib/content/lookup";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const entry = getEncyclopediaBySlug(slug);
  if (!entry) {
    return errorJson(404, "NOT_FOUND", "Ensiklopediya məqaləsi tapılmadı.", { slug });
  }
  return NextResponse.json({ entry });
}
