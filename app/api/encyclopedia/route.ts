import { NextResponse } from "next/server";
import { listEncyclopedia } from "@/lib/content/lookup";

export async function GET() {
  return NextResponse.json({ entries: listEncyclopedia() });
}
