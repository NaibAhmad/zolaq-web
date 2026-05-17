import "server-only";
import { PrismaClient } from "@prisma/client";

// HMR-guarded singleton, mirrors the globalThis pattern used by
// lib/admin/audit.ts:13 and the other 14 in-memory stores so dev reloads
// don't open a new pool on every edit.

const g = globalThis as unknown as { __zlq_prisma?: PrismaClient };

export const prisma: PrismaClient =
  g.__zlq_prisma ?? (g.__zlq_prisma = new PrismaClient({ log: ["warn", "error"] }));
