// Standard error envelope from docs/reference Step 6 v2 API_CONTRACT_DRAFT.md.

import { NextResponse } from "next/server";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "EXPIRED"
  | "LOCKED"
  | "UNAUTHENTICATED";

export function errorJson(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: { code, message, details: details ?? {} } },
    { status }
  );
}
