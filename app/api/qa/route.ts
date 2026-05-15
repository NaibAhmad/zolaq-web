import { NextResponse } from "next/server";
import { listQA } from "@/lib/content/lookup";

export async function GET() {
  return NextResponse.json({ qa: listQA() });
}
