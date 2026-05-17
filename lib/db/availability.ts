import "server-only";
import { prisma } from "./prisma";

// Hybrid-mode switch. Returns true ONLY if:
//   1. DATABASE_URL is set + non-empty + not the placeholder shipped in .env,
//   2. AND a one-time `SELECT 1` probe succeeds.
// Result is cached for the process lifetime — repositories pay the probe cost
// at most once. On any error we fall back to the in-memory store.

const PLACEHOLDER_HOST = "placeholder";

type ProbeState = { resolved: boolean; available: boolean; promise?: Promise<boolean> };

const g = globalThis as unknown as { __zlq_db_probe?: ProbeState };
const state: ProbeState = g.__zlq_db_probe ?? (g.__zlq_db_probe = { resolved: false, available: false });

function hasUsableUrl(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === PLACEHOLDER_HOST) return false;
  } catch {
    return false;
  }
  return true;
}

export async function isDatabaseAvailable(): Promise<boolean> {
  if (state.resolved) return state.available;
  if (state.promise) return state.promise;
  if (!hasUsableUrl()) {
    state.resolved = true;
    state.available = false;
    return false;
  }
  state.promise = probe();
  const result = await state.promise;
  state.resolved = true;
  state.available = result;
  state.promise = undefined;
  return result;
}

async function probe(): Promise<boolean> {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// Test helper — never use in app code.
export function __resetDatabaseAvailabilityCache(): void {
  state.resolved = false;
  state.available = false;
  state.promise = undefined;
}
