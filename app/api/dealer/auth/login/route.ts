// Sprint 9F dealer login. Two paths:
//   - DEV_AUTH_MODE=true + {dealer_id, contact_name} → seeded mock picker.
//   - {email, password}                              → real DB-backed scrypt verify.

import { NextResponse, type NextRequest } from "next/server";
import { getDealer } from "@/lib/admin";
import { writeAudit } from "@/lib/admin/audit";
import { writeAuditFireAndForget } from "@/lib/audit/repository";
import { setDealerSession } from "@/lib/auth/dealer-session";
import { AuthNotAvailableError } from "@/lib/auth/admin-user-repository";
import { verifyDealerPassword } from "@/lib/auth/dealer-user-repository";
import { errorJson } from "@/lib/auth/error";
import { DEV_AUTH_MODE } from "@/lib/env";

type LoginBody = {
  dealer_id?: string;
  contact_name?: string;
  email?: string;
  password?: string;
  redirect_to?: string;
};

async function readBody(request: NextRequest): Promise<LoginBody> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      return (await request.json()) as LoginBody;
    } catch {
      return {};
    }
  }
  const form = await request.formData();
  const out: LoginBody = {};
  for (const key of ["dealer_id", "contact_name", "email", "password", "redirect_to"] as const) {
    const v = form.get(key);
    if (typeof v === "string") out[key] = v;
  }
  return out;
}

function wantsJson(request: NextRequest): boolean {
  const accept = request.headers.get("accept") ?? "";
  const ct = request.headers.get("content-type") ?? "";
  return accept.includes("application/json") || ct.includes("application/json");
}

export async function POST(request: NextRequest) {
  const body = await readBody(request);
  const next =
    body.redirect_to && body.redirect_to.startsWith("/")
      ? body.redirect_to
      : "/dealer/dashboard";

  if (body.email && body.password) {
    try {
      const result = await verifyDealerPassword({
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
      const session = await setDealerSession({
        dealerId: result.user.dealer_id,
        contactName: result.user.display_name,
        role: result.user.role,
        dealerUserId: result.user.dealer_user_id,
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

  if (!DEV_AUTH_MODE) {
    try {
      writeAuditFireAndForget({
        actor_type: "system",
        actor_id: body.dealer_id ?? "unknown",
        role: "system",
        action: "dealer.login.blocked_production_mock",
        entity_type: "dealer",
        entity_id: body.dealer_id ?? "unknown",
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
  if (!body.dealer_id || !body.contact_name) {
    return errorJson(400, "VALIDATION_ERROR", "`dealer_id` və `contact_name` tələb olunur.");
  }
  const dealer = getDealer(body.dealer_id);
  if (!dealer) {
    try {
      writeAuditFireAndForget({
        actor_type: "system",
        actor_id: body.dealer_id,
        role: "system",
        action: "dealer.login.failed",
        entity_type: "dealer",
        entity_id: body.dealer_id,
        note: "unknown dealer_id",
      });
    } catch {
      // never fail the response on audit error
    }
    return errorJson(404, "NOT_FOUND", "Diler tapılmadı.");
  }
  const session = await setDealerSession({
    dealerId: dealer.dealer_id,
    contactName: body.contact_name,
    role: "owner",
  });
  writeAudit({
    actor_type: "dealer",
    actor_id: dealer.dealer_id,
    role: "dealer",
    action: "dealer.login",
    entity_type: "dealer",
    entity_id: dealer.dealer_id,
    note: body.contact_name,
  });

  if (wantsJson(request)) {
    return NextResponse.json({ ok: true, session });
  }
  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
