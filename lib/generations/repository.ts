import "server-only";

// Sprint 9C: Admin Generations CRUD. Bootstraps from the existing seed
// (lib/cars/generations.ts) into a globalThis-pinned mutable Map so admin
// edits survive HMR. The original GENERATIONS array stays as the canonical
// fallback that public reads (lib/cars/generations.ts:listGenerationsForModel
// and :getGenerationById) continue to use; the admin store *shadows* it for
// CRUD purposes only. When the catalog domain is cut over to DB in a future
// sprint, the public helpers will be re-pointed at this repository too.

import { GENERATIONS } from "@/lib/cars/generations";
import type { Generation } from "@/lib/cars/types";

export type GenerationExtended = Generation & {
  source?: string;
  verification_status?: string;
  created_at: number;
  updated_at: number;
};

export type CreateGenerationInput = {
  generation_id?: string;
  brand_id: string;
  model_name: string;
  name: string;
  display_name: string;
  production_year_from: number;
  production_year_to?: number | null;
  status?: Generation["status"];
  source?: string;
  verification_status?: string;
};

export type UpdateGenerationInput = Partial<Omit<CreateGenerationInput, "generation_id">>;

type Store = { generations: Map<string, GenerationExtended> };

const g = globalThis as unknown as { __zlq_generations_store?: Store };
const store: Store = g.__zlq_generations_store ?? (g.__zlq_generations_store = bootstrap());

function bootstrap(): Store {
  const now = Date.now();
  const map = new Map<string, GenerationExtended>();
  for (const seed of GENERATIONS) {
    map.set(seed.generation_id, {
      ...seed,
      created_at: now,
      updated_at: now,
    });
  }
  return { generations: map };
}

function createId(): string {
  const c: Crypto | undefined = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") {
    return `gen_${c.randomUUID()}`;
  }
  return `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listGenerations(filter?: {
  brand_id?: string;
  model_name?: string;
  status?: Generation["status"];
}): GenerationExtended[] {
  let rows = Array.from(store.generations.values());
  if (filter?.brand_id) rows = rows.filter((r) => r.brand_id === filter.brand_id);
  if (filter?.model_name) rows = rows.filter((r) => r.model_name === filter.model_name);
  if (filter?.status) rows = rows.filter((r) => r.status === filter.status);
  return rows
    .map((r) => ({ ...r }))
    .sort((a, b) => a.brand_id.localeCompare(b.brand_id) || a.model_name.localeCompare(b.model_name));
}

export function getGeneration(generationId: string): GenerationExtended | null {
  const g = store.generations.get(generationId);
  return g ? { ...g } : null;
}

export function createGeneration(input: CreateGenerationInput): GenerationExtended {
  const generation_id = input.generation_id ?? createId();
  if (store.generations.has(generation_id)) {
    throw new Error(`Generation already exists: ${generation_id}`);
  }
  const now = Date.now();
  const row: GenerationExtended = {
    generation_id,
    brand_id: input.brand_id,
    model_name: input.model_name,
    name: input.name,
    display_name: input.display_name,
    production_year_from: input.production_year_from,
    production_year_to: input.production_year_to ?? null,
    status: input.status ?? "active",
    ...(input.source !== undefined && { source: input.source }),
    ...(input.verification_status !== undefined && { verification_status: input.verification_status }),
    created_at: now,
    updated_at: now,
  };
  store.generations.set(generation_id, row);
  return { ...row };
}

export function updateGeneration(
  generationId: string,
  patch: UpdateGenerationInput,
): GenerationExtended | null {
  const existing = store.generations.get(generationId);
  if (!existing) return null;
  const next: GenerationExtended = {
    ...existing,
    ...patch,
    production_year_to:
      patch.production_year_to !== undefined ? patch.production_year_to : existing.production_year_to,
    updated_at: Date.now(),
  };
  store.generations.set(generationId, next);
  return { ...next };
}

export function archiveGeneration(generationId: string): GenerationExtended | null {
  return updateGeneration(generationId, { status: "inactive" });
}

// Reference-check is performed by the DELETE route handler itself (it imports
// listTrims directly to avoid a circular import). No helper here.
