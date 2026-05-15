import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { getTrimById } from "@/lib/cars/lookup";
import {
  createDecision,
  listDecisionsForUser,
} from "@/lib/decisions/store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  return NextResponse.json({
    decisions: listDecisionsForUser(session.userId),
  });
}

type CreateBody = {
  primary_trim_id?: unknown;
  candidate_trim_ids?: unknown;
  lead_ids?: unknown;
  title?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "JSON oxunmadı.");
  }

  if (typeof body.primary_trim_id !== "string" || !body.primary_trim_id) {
    return errorJson(400, "VALIDATION_ERROR", "primary_trim_id tələb olunur.");
  }
  if (!getTrimById(body.primary_trim_id)) {
    return errorJson(400, "VALIDATION_ERROR", "Trim tapılmadı.", {
      primary_trim_id: body.primary_trim_id,
    });
  }

  const candidate_trim_ids = isStringArray(body.candidate_trim_ids)
    ? body.candidate_trim_ids
    : undefined;
  const lead_ids = isStringArray(body.lead_ids) ? body.lead_ids : undefined;
  const title = typeof body.title === "string" ? body.title : undefined;

  const decision = createDecision({
    user_id: session.userId,
    primary_trim_id: body.primary_trim_id,
    candidate_trim_ids,
    lead_ids,
    title,
  });
  return NextResponse.json({ decision }, { status: 201 });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}
