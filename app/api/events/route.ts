// POST /api/events — PII-safe tracking endpoint.
//
// MVP behaviour: validate, then drop. No persistence layer. Returns 202 on
// accepted events. PII keys in payload → 422 VALIDATION_ERROR. Unknown
// event_name → 422 VALIDATION_ERROR. The tracking spec lives at
// docs/reference/.../TRACKING_EVENTS.json — keep lib/tracking/events.ts in
// sync with it.

import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { BANNED_PII_KEYS, isEventName } from "@/lib/tracking/events";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "JSON gövdə tələb olunur.");
  }
  if (!isPlainObject(body)) {
    return errorJson(400, "VALIDATION_ERROR", "Obyekt gövdə tələb olunur.");
  }

  const eventName = body.event_name;
  if (!isEventName(eventName)) {
    return errorJson(422, "VALIDATION_ERROR", "Naməlum event_name.", {
      field: "event_name",
    });
  }

  const payload = body.payload ?? {};
  if (!isPlainObject(payload)) {
    return errorJson(422, "VALIDATION_ERROR", "Payload obyekt olmalıdır.", {
      field: "payload",
    });
  }

  const violations = Object.keys(payload).filter((k) =>
    BANNED_PII_KEYS.includes(k)
  );
  if (violations.length > 0) {
    return errorJson(422, "VALIDATION_ERROR", "Payload PII açarı ehtiva edir.", {
      banned_keys: violations,
    });
  }

  // Validate optional global fields are well-typed when present (defensive).
  const sessionId = body.session_id;
  if (sessionId !== undefined && typeof sessionId !== "string") {
    return errorJson(422, "VALIDATION_ERROR", "session_id sətir olmalıdır.", {
      field: "session_id",
    });
  }

  return NextResponse.json({ accepted: true }, { status: 202 });
}
