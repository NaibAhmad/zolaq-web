// Shared helpers for admin/dealer internal API routes:
// - parseBody: accepts JSON or form-urlencoded/multipart; returns a plain object
// - requireAdmin / requireDealer: returns the session or an error response
// - methodOverride: reads `_method` from the body so HTML forms can PATCH
// - redirectBack: for HTML form submissions, returns to the originating page

import { NextResponse, type NextRequest } from "next/server";
import type { WriteAuditInput } from "./audit";
import { writeAuditFireAndForget } from "@/lib/audit/repository";
import { getAdminSession, type AdminSession } from "@/lib/auth/admin-session";
import { getDealerSession, type DealerSession } from "@/lib/auth/dealer-session";
import { errorJson } from "@/lib/auth/error";
import type { AdminRole } from "@/lib/auth/constants";
import { adminCan, dealerCan, type Permission } from "@/lib/auth/permissions";

export type ParsedBody = Record<string, FormDataEntryValue | undefined>;

export async function parseBody(request: NextRequest): Promise<ParsedBody> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const json = (await request.json()) as Record<string, unknown>;
      const out: ParsedBody = {};
      for (const [k, v] of Object.entries(json)) {
        if (v == null) continue;
        out[k] = String(v);
      }
      return out;
    } catch {
      return {};
    }
  }
  const form = await request.formData();
  const out: ParsedBody = {};
  for (const [k, v] of form.entries()) out[k] = v;
  return out;
}

export function pick<T extends string>(body: ParsedBody, key: T): string | undefined {
  const v = body[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function pickNumber(body: ParsedBody, key: string): number | undefined {
  const v = pick(body, key);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function methodOverride(body: ParsedBody, fallback: string): string {
  const m = pick(body, "_method");
  return m ? m.toUpperCase() : fallback;
}

export async function requireAdmin(
  request: NextRequest,
  ...allowedRoles: readonly AdminRole[]
): Promise<{ session: AdminSession } | { response: NextResponse }> {
  const session = await getAdminSession();
  if (!session) {
    return {
      response: wantsHtml(request)
        ? NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 })
        : errorJson(401, "UNAUTHENTICATED", "Admin sessiyası tələb olunur."),
    };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    auditForbidden(session, request, allowedRoles.join(","));
    return {
      response: errorJson(403, "FORBIDDEN", "Bu əməliyyat üçün icazəniz yoxdur."),
    };
  }
  return { session };
}

// Sprint 9E: permission-based variant. Prefer this for new routes; the
// role-based requireAdmin stays for existing call sites until they migrate.
export async function requireAdminPermission(
  request: NextRequest,
  permission: Permission,
): Promise<{ session: AdminSession } | { response: NextResponse }> {
  const session = await getAdminSession();
  if (!session) {
    return {
      response: wantsHtml(request)
        ? NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 })
        : errorJson(401, "UNAUTHENTICATED", "Admin sessiyası tələb olunur."),
    };
  }
  if (!adminCan(session.role, permission)) {
    auditForbidden(session, request, permission);
    return {
      response: errorJson(403, "FORBIDDEN", "Bu əməliyyat üçün icazəniz yoxdur."),
    };
  }
  return { session };
}

export async function requireDealer(
  request: NextRequest,
): Promise<{ session: DealerSession } | { response: NextResponse }> {
  const session = await getDealerSession();
  if (!session) {
    return {
      response: wantsHtml(request)
        ? NextResponse.redirect(new URL("/dealer/login", request.url), { status: 303 })
        : errorJson(401, "UNAUTHENTICATED", "Diler sessiyası tələb olunur."),
    };
  }
  return { session };
}

// Sprint 9F: per-action dealer permission check. Wraps requireDealer and
// additionally enforces the dealer.* permission matrix from
// lib/auth/permissions.ts. 403 + audit on failure.
export async function requireDealerPermission(
  request: NextRequest,
  permission: Permission,
): Promise<{ session: DealerSession } | { response: NextResponse }> {
  const result = await requireDealer(request);
  if ("response" in result) return result;
  if (!dealerCan(result.session.role, permission)) {
    auditDealerForbidden(result.session, request, permission);
    return {
      response: errorJson(403, "FORBIDDEN", "Bu əməliyyat üçün icazəniz yoxdur."),
    };
  }
  return { session: result.session };
}

function auditDealerForbidden(
  session: DealerSession,
  request: NextRequest,
  required: string,
): void {
  try {
    writeAuditFireAndForget({
      actor_type: "dealer",
      actor_id: session.dealerId,
      role: session.role,
      action: "auth.forbidden",
      entity_type: "route",
      entity_id: new URL(request.url).pathname,
      note: `required=${required}`,
    });
  } catch {
    // never fail the response on audit error
  }
}

// Sprint 9E: callers that *receive* a dealer_id in path/body should compare
// it to session.dealerId and call this when they don't match — gives the
// AuditLog a record of cross-dealer access attempts (low-noise in normal
// operation; a spike means someone is probing scope enforcement). Always
// fire-and-forget so the audit write never breaks the 404 response.
export function auditDealerScopeViolation(
  session: DealerSession,
  attemptedDealerId: string,
  entity: { type: string; id: string },
): void {
  try {
    writeAuditFireAndForget({
      actor_type: "dealer",
      actor_id: session.dealerId,
      role: session.role,
      action: "auth.dealer_scope_violation",
      entity_type: entity.type,
      entity_id: entity.id,
      note: `attempted dealer_id=${attemptedDealerId}`,
    });
  } catch {
    // never fail the response on audit error
  }
}

function auditForbidden(
  session: AdminSession,
  request: NextRequest,
  required: string,
): void {
  try {
    writeAuditFireAndForget({
      actor_type: "admin",
      actor_id: session.adminId,
      role: session.role,
      action: "auth.forbidden",
      entity_type: "route",
      entity_id: new URL(request.url).pathname,
      note: `required=${required}`,
    });
  } catch {
    // never fail the response on audit error
  }
}

export function wantsHtml(request: NextRequest): boolean {
  const accept = request.headers.get("accept") ?? "";
  const ct = request.headers.get("content-type") ?? "";
  return (
    accept.includes("text/html") ||
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  );
}

export function respond(
  request: NextRequest,
  payload: Record<string, unknown>,
  fallbackPath: string,
): NextResponse {
  if (wantsHtml(request)) {
    const referer = request.headers.get("referer");
    const target = referer && new URL(referer).pathname.startsWith("/") ? referer : fallbackPath;
    return NextResponse.redirect(new URL(target, request.url), { status: 303 });
  }
  return NextResponse.json(payload);
}

export function audit(
  actor: AdminSession | DealerSession | { id: string; role: string },
  rest: Omit<WriteAuditInput, "actor_type" | "actor_id" | "role">,
): void {
  let actor_type: WriteAuditInput["actor_type"];
  let actor_id: string;
  let role: string;
  if ("adminId" in actor) {
    actor_type = "admin";
    actor_id = actor.adminId;
    role = actor.role;
  } else if ("dealerId" in actor) {
    actor_type = "dealer";
    actor_id = actor.dealerId;
    role = "dealer";
  } else {
    actor_type = "system";
    actor_id = actor.id;
    role = actor.role;
  }
  // Fire-and-forget: in DB mode the audit row is written async after the
  // response is sent. We accept that trade-off this sprint because no domain
  // mutations have been cut over to DB yet (R9 tx requirement kicks in only
  // once mutations live in Postgres). See docs/sprint-9b/FALLBACK_MODE.md.
  writeAuditFireAndForget({ ...rest, actor_type, actor_id, role });
}
