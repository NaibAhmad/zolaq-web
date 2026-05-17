// Sprint 8A audit log. In-memory, pinned to globalThis so HMR keeps state.
// Every mutation across admin/dealer stores writes one entry through writeAudit.

import { randomUUID } from "node:crypto";
import type {
  AuditAction,
  AuditActorType,
  AuditLogEntry,
} from "./types";

type AuditStore = { entries: AuditLogEntry[] };

const g = globalThis as unknown as { __zlq_audit_store?: AuditStore };
const store: AuditStore =
  g.__zlq_audit_store ?? (g.__zlq_audit_store = { entries: [] });

export type WriteAuditInput = {
  actor_type: AuditActorType;
  actor_id: string;
  role: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
};

export function writeAudit(input: WriteAuditInput): AuditLogEntry {
  const entry: AuditLogEntry = {
    audit_id: `audit_${randomUUID()}`,
    actor_type: input.actor_type,
    actor_id: input.actor_id,
    role: input.role,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    ...(input.before !== undefined && { before: input.before }),
    ...(input.after !== undefined && { after: input.after }),
    ...(input.note !== undefined && { note: input.note }),
    created_at: Date.now(),
  };
  store.entries.push(entry);
  return { ...entry };
}

export type ListAuditOptions = {
  limit?: number;
  actor_id?: string;
  entity_type?: string;
  entity_id?: string;
  action?: AuditAction;
};

export function listAuditLog(options: ListAuditOptions = {}): AuditLogEntry[] {
  let rows = store.entries.slice();
  if (options.actor_id) rows = rows.filter((e) => e.actor_id === options.actor_id);
  if (options.entity_type) rows = rows.filter((e) => e.entity_type === options.entity_type);
  if (options.entity_id) rows = rows.filter((e) => e.entity_id === options.entity_id);
  if (options.action) rows = rows.filter((e) => e.action === options.action);
  rows.sort((a, b) => b.created_at - a.created_at);
  if (options.limit !== undefined) rows = rows.slice(0, options.limit);
  return rows.map((e) => ({ ...e }));
}
