import "server-only";
import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";
import {
  listAuditLog as memListAuditLog,
  writeAudit as memWriteAudit,
  type ListAuditOptions,
  type WriteAuditInput,
} from "@/lib/admin/audit";
import type { AuditAction, AuditActorType, AuditLogEntry } from "@/lib/admin/types";
import { isDatabaseAvailable } from "@/lib/db/availability";
import { prisma } from "@/lib/db/prisma";

// Sprint 9B: AuditLog is the FIRST and ONLY domain cut over to DB this sprint
// (per docs/sprint-9a/SEED_TO_DATABASE_MIGRATION_PLAN.md — audit-log first as
// the safest write-only foundation). When DB is unavailable, delegates to the
// existing in-memory store at lib/admin/audit.ts so the app keeps working with
// no DATABASE_URL. Public function signatures match the in-memory module
// exactly so consumers swap import paths only.

export type { ListAuditOptions, WriteAuditInput } from "@/lib/admin/audit";

export async function writeAudit(input: WriteAuditInput): Promise<AuditLogEntry> {
  if (await isDatabaseAvailable()) {
    const audit_id = `audit_${randomUUID()}`;
    const row = await prisma.auditLog.create({
      data: {
        audit_id,
        actor_type: input.actor_type,
        actor_id: input.actor_id,
        role: input.role,
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        before: (input.before ?? undefined) as Prisma.InputJsonValue | undefined,
        after: (input.after ?? undefined) as Prisma.InputJsonValue | undefined,
        note: input.note,
      },
    });
    return mapRow(row);
  }
  return memWriteAudit(input);
}

// Fire-and-forget version for routes that already finished their work and
// shouldn't await the audit row. Errors are swallowed (audit must never break
// the caller's response). Use sparingly — prefer the awaited writeAudit so
// the audit row is durable before HTTP 200.
export function writeAuditFireAndForget(input: WriteAuditInput): void {
  void writeAudit(input).catch(() => undefined);
}

export async function listAuditLog(options: ListAuditOptions = {}): Promise<AuditLogEntry[]> {
  if (await isDatabaseAvailable()) {
    const rows = await prisma.auditLog.findMany({
      where: {
        ...(options.actor_id && { actor_id: options.actor_id }),
        ...(options.entity_type && { entity_type: options.entity_type }),
        ...(options.entity_id && { entity_id: options.entity_id }),
        ...(options.action && { action: options.action }),
      },
      orderBy: { created_at: "desc" },
      take: options.limit ?? undefined,
    });
    return rows.map(mapRow);
  }
  return memListAuditLog(options);
}

type DbAuditRow = {
  audit_id: string;
  actor_type: string;
  actor_id: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before: unknown;
  after: unknown;
  note: string | null;
  created_at: Date;
};

function mapRow(row: DbAuditRow): AuditLogEntry {
  const entry: AuditLogEntry = {
    audit_id: row.audit_id,
    actor_type: row.actor_type as AuditActorType,
    actor_id: row.actor_id,
    role: row.role,
    action: row.action as AuditAction,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    created_at: row.created_at.getTime(),
  };
  if (row.before != null) entry.before = row.before as Record<string, unknown>;
  if (row.after != null) entry.after = row.after as Record<string, unknown>;
  if (row.note != null) entry.note = row.note;
  return entry;
}
