import "server-only";
import { randomUUID } from "node:crypto";

import { isDatabaseAvailable } from "@/lib/db/availability";
import { prisma } from "@/lib/db/prisma";
import { writeAuditFireAndForget } from "@/lib/audit/repository";
import { isDealerRole, type DealerRole } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";
import { AuthNotAvailableError } from "@/lib/auth/admin-user-repository";

// Sprint 9F: real DB-backed dealer authentication.

export type DealerUserRecord = {
  dealer_user_id: string;
  dealer_id: string;
  email: string | null;
  phone_hash: string | null;
  display_name: string;
  role: DealerRole;
  status: "active" | "disabled";
  last_login_at: Date | null;
  failed_login_count: number;
};

export type DealerCredentials = {
  email: string;
  password: string;
};

export type VerifyDealerPasswordResult =
  | { ok: true; user: DealerUserRecord; sessionId: string }
  | { ok: false; reason: "invalid_credentials" | "disabled" | "locked" };

const FAILED_LOGIN_LOCK_THRESHOLD = 5;
const FAILED_LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 60 * 60 * 24 * 7 * 1000;

type DealerUserRow = {
  dealer_user_id: string;
  dealer_id: string;
  email: string | null;
  phone_hash: string | null;
  password_hash: string | null;
  role: string;
  status: string;
  last_login_at: Date | null;
  failed_login_count: number;
};

async function requireDb(): Promise<void> {
  if (!(await isDatabaseAvailable())) {
    throw new AuthNotAvailableError();
  }
}

function toRecord(
  row: DealerUserRow,
  displayName?: string,
): DealerUserRecord {
  return {
    dealer_user_id: row.dealer_user_id,
    dealer_id: row.dealer_id,
    email: row.email,
    phone_hash: row.phone_hash,
    display_name: displayName ?? row.email ?? row.dealer_user_id,
    role: isDealerRole(row.role) ? row.role : "owner",
    status: row.status === "disabled" ? "disabled" : "active",
    last_login_at: row.last_login_at,
    failed_login_count: row.failed_login_count,
  };
}

async function findFirstByEmail(email: string): Promise<DealerUserRow | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return prisma.dealerUser.findFirst({ where: { email: normalized } });
}

export async function findDealerUserByEmail(
  email: string,
): Promise<DealerUserRecord | null> {
  await requireDb();
  const row = await findFirstByEmail(email);
  return row ? toRecord(row) : null;
}

export async function verifyDealerPassword(
  creds: DealerCredentials,
): Promise<VerifyDealerPasswordResult> {
  await requireDb();
  const email = creds.email.trim().toLowerCase();
  if (!email || !creds.password) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const row = await findFirstByEmail(email);
  if (!row) return { ok: false, reason: "invalid_credentials" };

  if (row.status === "disabled") {
    return { ok: false, reason: "disabled" };
  }

  const lastLogin = row.last_login_at?.getTime() ?? 0;
  const lockUntil = lastLogin + FAILED_LOGIN_LOCK_WINDOW_MS;
  if (
    row.failed_login_count >= FAILED_LOGIN_LOCK_THRESHOLD &&
    Date.now() < lockUntil
  ) {
    return { ok: false, reason: "locked" };
  }

  const ok = await verifyPassword(creds.password, row.password_hash);
  if (!ok) {
    await prisma.dealerUser.update({
      where: { dealer_user_id: row.dealer_user_id },
      data: { failed_login_count: { increment: 1 } },
    });
    writeAuditFireAndForget({
      actor_type: "system",
      actor_id: row.dealer_user_id,
      role: "system",
      action: "dealer.login.failed",
      entity_type: "dealer_user",
      entity_id: row.dealer_user_id,
    });
    return { ok: false, reason: "invalid_credentials" };
  }

  const now = new Date();
  const sessionId = `dsess_${randomUUID()}`;
  const role: DealerRole = isDealerRole(row.role) ? row.role : "owner";
  await prisma.$transaction([
    prisma.dealerUser.update({
      where: { dealer_user_id: row.dealer_user_id },
      data: { failed_login_count: 0, last_login_at: now },
    }),
    prisma.dealerSession.create({
      data: {
        session_id: sessionId,
        dealer_user_id: row.dealer_user_id,
        dealer_id: row.dealer_id,
        role,
        issued_at: now,
        expires_at: new Date(now.getTime() + SESSION_TTL_MS),
      },
    }),
  ]);

  writeAuditFireAndForget({
    actor_type: "dealer",
    actor_id: row.dealer_user_id,
    role,
    action: "dealer.login",
    entity_type: "dealer_user",
    entity_id: row.dealer_user_id,
  });

  const refreshed = await prisma.dealerUser.findUnique({
    where: { dealer_user_id: row.dealer_user_id },
  });
  const recordRow = refreshed ?? { ...row, failed_login_count: 0, last_login_at: now };
  return {
    ok: true,
    user: toRecord(recordRow, recordRow.email ?? row.dealer_user_id),
    sessionId,
  };
}

export async function revokeDealerSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  if (!(await isDatabaseAvailable())) return;
  await prisma.dealerSession
    .update({
      where: { session_id: sessionId },
      data: { revoked_at: new Date() },
    })
    .catch(() => undefined);
}

export async function isDealerSessionRevoked(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  if (!(await isDatabaseAvailable())) return false;
  const row = await prisma.dealerSession.findUnique({
    where: { session_id: sessionId },
    select: { revoked_at: true, expires_at: true },
  });
  if (!row) return false;
  if (row.revoked_at) return true;
  if (row.expires_at.getTime() < Date.now()) return true;
  return false;
}

export async function upsertDealerUser(input: {
  dealer_user_id?: string;
  dealer_id: string;
  email: string;
  password_hash: string;
  role: DealerRole;
}): Promise<DealerUserRecord> {
  await requireDb();
  const email = input.email.trim().toLowerCase();
  const dealerUserId = input.dealer_user_id ?? `dlu_${randomUUID()}`;
  const row = await prisma.dealerUser.upsert({
    where: { dealer_id_email: { dealer_id: input.dealer_id, email } },
    create: {
      dealer_user_id: dealerUserId,
      dealer_id: input.dealer_id,
      email,
      password_hash: input.password_hash,
      role: input.role,
      status: "active",
    },
    update: {
      password_hash: input.password_hash,
      role: input.role,
      status: "active",
    },
  });
  return toRecord(row);
}
