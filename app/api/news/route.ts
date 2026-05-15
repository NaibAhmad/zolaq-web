import { NextResponse } from "next/server";
import { listNews } from "@/lib/content/lookup";

export async function GET() {
  return NextResponse.json({ news: listNews() });
}
