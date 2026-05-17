import "server-only";

// Sprint 9C: TrimSpec advanced fields. Mirrors the Trim table 1:1 by trim_id
// and is kept SEPARATE from the existing catalog-store map so the basic Trim
// shape (used by Sprint 8H search/filters and public reads) stays unchanged.
// Pinned to globalThis like every other in-memory store. Future Sprint will
// swap this for `prisma.trimSpec` reads/writes when catalog is cut over.

export type TrimSpec = {
  trim_id: string;
  engine?: string;
  engine_displacement_l?: number;
  torque_nm?: number;
  transmission?: string;
  drivetrain?: string;
  seats?: number;
  battery_kwh?: number;
  fuel_consumption_l_100km?: number;
  charging_ac_kw?: number;
  charging_dc_kw?: number;
  acceleration_0_100?: number;
  dimensions?: string;
  ground_clearance?: number;
  warranty?: string;
  source?: string;
  verification_status?: string;
  last_updated?: string; // ISO-8601
};

export type TrimSpecInput = Omit<TrimSpec, "trim_id"> & { trim_id: string };

type SpecStore = { specs: Map<string, TrimSpec> };

const g = globalThis as unknown as { __zlq_trim_specs?: SpecStore };
const store: SpecStore = g.__zlq_trim_specs ?? (g.__zlq_trim_specs = { specs: new Map() });

export function getTrimSpec(trimId: string): TrimSpec | null {
  const s = store.specs.get(trimId);
  return s ? { ...s } : null;
}

export function upsertTrimSpec(input: TrimSpecInput): TrimSpec {
  const existing = store.specs.get(input.trim_id);
  const merged: TrimSpec = {
    ...existing,
    ...input,
    last_updated: input.last_updated ?? new Date().toISOString(),
  };
  store.specs.set(input.trim_id, merged);
  return { ...merged };
}
