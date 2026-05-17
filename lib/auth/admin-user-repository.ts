import "server-only";
import { randomUUID } from "node:crypto";

import { isDatabaseAvailable } from "@/lib/db/availability";
import { prisma } from "@/lib/db/prisma";
import { writeAuditFireAndForget } from "@/lib/audit/repository";
import { isAdminRole, type AdminRole } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";

// Sprint 9F: real DB-backed admin authentication. Replaces the 9E stubs.
// Falls back gracefully when DATABASE_URL is unavailable — every public fn
// throws `AuthNotAvailableError` so route handlers can return 503.

export class AuthNotAvailableError extends Error {
  constructor(message = "AUTH_NOT_AVAILABLE") {
    super(message);
    this.name = "AuthNotAvailableError";
  }
}

export type AdminUserRecord = {
  admin_id: string;
  email: string;
  display_name: string;
  status: "active" | "disabled";
  roles: AdminRole[];
  last_login_at: Date | null;
  failed_login_count: number;
};

export type AdminCredentials = {
  email: string;
  password: string;
};

export type VerifyAdminPasswordResult =
  | { ok: true; user: AdminUserRecord; sessionId: string }
  | { ok: false; reason: "invalid_credentials" | "disabled" | "locked" };

const FAILED_LOGIN_LOCK_THRESHOLD = 5;
const FAILED_LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 60 * 60 * 24 * 7 * 1000;

async function requireDb(): Promise<void> {
  if (!(await isDatabaseAvailable())) {
    throw new AuthNotAvailableError();
  }
}

function toRecord(row: {
  admin_id: string;
  email: string;
  display_name: string;
  status: string;
  last_login_at: Date | null;
  failed_login_count: number;
  roles: { role: string }[];
}): AdminUserRecord {
  const roles = row.roles
    .map((r) => r.role)
    .filter((r): r is AdminRole => isAdminRole(r));
  return {
    admin_id: row.admin_id,
    email: row.email,
    display_name: row.display_name,
    status: row.status === "disabled" ? "disabled" : "active",
    roles,
    last_login_at: row.last_login_at,
    failed_login_count: row.failed_login_count,
  };
}

export async function findAdminByEmail(email: string): Promise<AdminUserRecord | null> {
  await requireDb();
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const row = await prisma.adminUser.findUnique({
    where: { email: normalized },
    include: { roles: true },
  });
  return row ? toRecord(row) : null;
}

export async function verifyAdminPassword(
  creds: AdminCredentials,
): Promise<VerifyAdminPasswordResult> {
  await requireDb();
  const email = creds.email.trim().toLowerCase();
  if (!email || !creds.password) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const row = await prisma.adminUser.findUnique({
    where: { email },
    include: { roles: true },
  });
  if (!row) return { ok: false, reason: "invalid_credentials" };

  if (row.status === "disabled") {
    return { ok: false, reason: "disabled" };
  }

  // Soft lockout: if too many recent failures within window, freeze.
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
    await prisma.adminUser.update({
      where: { admin_id: row.admin_id },
      data: { failed_login_count: { increment: 1 } },
    });
    writeAuditFireAndForget({
      actor_type: "system",
      actor_id: row.admin_id,
      role: "system",
      action: "admin.login.failed",
      entity_type: "admin",
      entity_id: row.admin_id,
    });
    return { ok: false, reason: "invalid_credentials" };
  }

  // Success: reset counter, stamp last_login_at, create session row.
  const now = new Date();
  const sessionId = `asess_${randomUUID()}`;
  await prisma.$transaction([
    prisma.adminUser.update({
      where: { admin_id: row.admin_id },
      data: { failed_login_count: 0, last_login_at: now },
    }),
    prisma.adminSession.create({
      data: {
        session_id: sessionId,
        admin_id: row.admin_id,
        issued_at: now,
        expires_at: new Date(now.getTime() + SESSION_TTL_MS),
      },
    }),
  ]);

  writeAuditFireAndForget({
    actor_type: "admin",
    actor_id: row.admin_id,
    role: row.roles[0]?.role ?? "admin",
    action: "admin.login",
    entity_type: "admin",
    entity_id: row.admin_id,
  });

  const refreshed = await prisma.adminUser.findUnique({
    where: { admin_id: row.admin_id },
    include: { roles: true },
  });
  return {
    ok: true,
    user: refreshed ? toRecord(refreshed) : toRecord({ ...row, failed_login_count: 0, last_login_at: now }),
    sessionId,
  };
}

export async function revokeAdminSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  if (!(await isDatabaseAvailable())) return;
  await prisma.adminSession
    .update({
      where: { session_id: sessionId },
      data: { revoked_at: new Date() },
    })
    .catch(() => undefined);
}

export async function isAdminSessionRevoked(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  if (!(await isDatabaseAvailable())) return false;
  const row = await prisma.adminSession.findUnique({
    where: { session_id: sessionId },
    select: { revoked_at: true, expires_at: true },
  });
  if (!row) return false;
  if (row.revoked_at) return true;
  if (row.expires_at.getTime() < Date.now()) return true;
  return false;
}

export async function upsertAdmin(input: {
  admin_id?: string;
  email: string;
  display_name: string;
  password_hash: string;
  roles: AdminRole[];
}): Promise<AdminUserRecord> {
  await requireDb();
  const email = input.email.trim().toLowerCase();
  const adminId = input.admin_id ?? `adm_${randomUUID()}`;
  const row = await prisma.adminUser.upsert({
    where: { email },
    create: {
      admin_id: adminId,
      email,
      display_name: input.display_name,
      password_hash: input.password_hash,
      status: "active",
      roles: {
        createMany: {
          data: input.roles.map((r) => ({ role: r })),
          skipDuplicates: true,
        },
      },
    },
    update: {
      display_name: input.display_name,
      password_hash: input.password_hash,
      status: "active",
      roles: {
        deleteMany: {},
        createMany: {
          data: input.roles.map((r) => ({ role: r })),
          skipDuplicates: true,
        },
      },
    },
    include: { roles: true },
  });
  return toRecord(row);
}
