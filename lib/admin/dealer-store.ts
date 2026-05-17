// Sprint 8B mutable dealer store. Wraps lib/dealers/seed.ts so admin writes
// survive HMR without altering the read-only seed export. Public lookup
// (lib/dealers/lookup.ts) still reads from the seed; the admin/dealer panels
// read through this store. When migrating to a real DB, this is the seam.

import { randomUUID } from "node:crypto";
import { DEALERS } from "@/lib/dealers/seed";
import type { Dealer } from "@/lib/dealers/types";

type DealerStore = { dealers: Map<string, Dealer> };

const g = globalThis as unknown as { __zlq_dealer_admin_store?: DealerStore };
const store: DealerStore =
  g.__zlq_dealer_admin_store ??
  (g.__zlq_dealer_admin_store = {
    dealers: new Map(DEALERS.map((d) => [d.dealer_id, { ...d }])),
  });

export function listDealers(): Dealer[] {
  return Array.from(store.dealers.values()).map((d) => ({ ...d }));
}

export function getDealer(dealerId: string): Dealer | null {
  const d = store.dealers.get(dealerId);
  return d ? { ...d } : null;
}

export type CreateDealerInput = Omit<Dealer, "updated_at"> & {
  updated_at?: string;
};

export function createDealer(input: CreateDealerInput): Dealer {
  const dealer_id = input.dealer_id || `dealer_${randomUUID()}`;
  const dealer: Dealer = {
    ...input,
    dealer_id,
    updated_at: input.updated_at ?? new Date().toISOString(),
  };
  store.dealers.set(dealer_id, dealer);
  return { ...dealer };
}

export function updateDealer(
  dealerId: string,
  patch: Partial<Omit<Dealer, "dealer_id">>,
): Dealer | null {
  const d = store.dealers.get(dealerId);
  if (!d) return null;
  const next: Dealer = {
    ...d,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  store.dealers.set(dealerId, next);
  return { ...next };
}
