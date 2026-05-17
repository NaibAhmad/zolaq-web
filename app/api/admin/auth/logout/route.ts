import { NextResponse, type NextRequest } from "next/server";
import { writeAudit } from "@/lib/admin/audit";
import {
  clearAdminSession,
  getAdminSession,
} from "@/lib/auth/admin-session";
import { revokeAdminSession } from "@/lib/auth/admin-user-repository";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  await clearAdminSession();
  if (session) {
    if (session.sessionId) {
      await revokeAdminSession(session.sessionId);
    }
    writeAudit({
      actor_type: "admin",
      actor_id: session.adminId,
      role: session.role,
      action: "admin.logout",
      entity_type: "admin",
      entity_id: session.adminId,
    });
  }
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  });
}
