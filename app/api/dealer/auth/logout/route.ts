import { NextResponse, type NextRequest } from "next/server";
import { writeAudit } from "@/lib/admin/audit";
import {
  clearDealerSession,
  getDealerSession,
} from "@/lib/auth/dealer-session";
import { revokeDealerSession } from "@/lib/auth/dealer-user-repository";

export async function POST(request: NextRequest) {
  const session = await getDealerSession();
  await clearDealerSession();
  if (session) {
    if (session.sessionId) {
      await revokeDealerSession(session.sessionId);
    }
    writeAudit({
      actor_type: "dealer",
      actor_id: session.dealerId,
      role: "dealer",
      action: "dealer.logout",
      entity_type: "dealer",
      entity_id: session.dealerId,
    });
  }
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/dealer/login", request.url), {
    status: 303,
  });
}
