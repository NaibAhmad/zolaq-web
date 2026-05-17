// Sprint 9F admin login. Two paths:
//   - DEV_AUTH_MODE=true + {admin_id}        → seeded mock picker (dev-only).
//   - {email, password}                       → real DB-backed scrypt verify.
// AUTH_NOT_AVAILABLE is returned in production-like mode when the DB is down.

import { NextResponse, type NextRequest } from "next/server";
import { writeAudit } from "@/lib/admin/audit";
import { writeAuditFireAndForget } from "@/lib/audit/repository";
import { getAdminById } from "@/lib/admin/store";
import {
  AuthNotAvailableError,
  verifyAdminPassword,
} from "@/lib/auth/admin-user-repository";
import { setAdminSession } from "@/lib/auth/admin-session";
import { errorJson } from "@/lib/auth/error";
import { DEV_AUTH_MODE } from "@/lib/env";

type LoginBody = {
  admin_id?: string;
  email?: string;
  password?: string;
  redirect_to?: string;
};

async function readBody(request: NextRequest): Promise<LoginBody> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return (await request.json()) as LoginBody;
    } catch {
      return {};
    }
  }
  const form = await request.formData();
  const out: LoginBody = {};
  const adminId = form.get("admin_id");
  const email = form.get("email");
  const password = form.get("password");
  const redirectTo = form.get("redirect_to");
  if (typeof adminId === "string") out.admin_id = adminId;
  if (typeof email === "string") out.email = email;
  if (typeof password === "string") out.password = password;
  if (typeof redirectTo === "string") out.redirect_to = redirectTo;
  return out;
}

function wantsJson(request: NextRequest): boolean {
  const accept = request.headers.get("accept") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  return accept.includes("application/json") || contentType.includes("application/json");
}

export async function POST(request: NextRequest) {
  const body = await readBody(request);
  const next =
    body.redirect_to && body.redirect_to.startsWith("/")
      ? body.redirect_to
      : "/admin/dashboard";

  // Real password path takes priority when credentials are present.
  if (body.email && body.password) {
    try {
      const result = await verifyAdminPassword({
        email: body.email,
        password: body.password,
      });
      if (!result.ok) {
        const status = result.reason === "locked" ? 423 : 401;
        const code = result.reason === "locked" ? "LOCKED" : "UNAUTHENTICATED";
        const message =
          result.reason === "locked"
            ? "Çox sayda uğursuz cəhd. Bir az sonra yenidən cəhd edin."
            : "Etibarsız giriş məlumatları.";
        return errorJson(status, code, message);
      }
      const session = await setAdminSession({
        adminId: result.user.admin_id,
        name: result.user.display_name,
        role: result.user.roles[0] ?? "moderator",
        sessionId: result.sessionId,
      });
      if (wantsJson(request)) {
        return NextResponse.json({ ok: true, session });
      }
      return NextResponse.redirect(new URL(next, request.url), { status: 303 });
    } catch (err) {
      if (err instanceof AuthNotAvailableError) {
        return errorJson(
          503,
          "AUTH_NOT_AVAILABLE",
          "Giriş xidməti hazırda əlçatan deyil.",
        );
      }
      throw err;
    }
  }

  // Legacy mock-picker path — DEV ONLY.
  if (!DEV_AUTH_MODE) {
    try {
      writeAuditFireAndForget({
        actor_type: "system",
        actor_id: body.admin_id ?? "unknown",
        role: "system",
        action: "admin.login.blocked_production_mock",
        entity_type: "admin",
        entity_id: body.admin_id ?? "unknown",
      });
    } catch {
      // never fail the response on audit error
    }
    return errorJson(
      503,
      "AUTH_NOT_AVAILABLE",
      "Real giriş üçün email/şifrə tələb olunur.",
    );
  }

  const adminId = body.admin_id;
  if (!adminId) {
    return errorJson(400, "VALIDATION_ERROR", "`admin_id` və ya email/şifrə tələb olunur.");
  }
  const admin = getAdminById(adminId);
  if (!admin) {
    try {
      writeAuditFireAndForget({
        actor_type: "system",
        actor_id: adminId,
        role: "system",
        action: "admin.login.failed",
        entity_type: "admin",
        entity_id: adminId,
        note: "unknown admin_id",
      });
    } catch {
      // never fail the response on audit error
    }
    return errorJson(404, "NOT_FOUND", "Admin hesabı tapılmadı.");
  }
  const session = await setAdminSession({
    adminId: admin.admin_id,
    name: admin.name,
    role: admin.role,
  });
  writeAudit({
    actor_type: "admin",
    actor_id: admin.admin_id,
    role: admin.role,
    action: "admin.login",
    entity_type: "admin",
    entity_id: admin.admin_id,
  });

  if (wantsJson(request)) {
    return NextResponse.json({ ok: true, session });
  }
  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
