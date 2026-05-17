// Sprint 8B mutable catalog store. Wraps the existing read-only seed
// (lib/cars/seed.ts) in a globalThis-pinned Map so admin edits survive HMR
// without touching the public lookup helpers. Public reads continue to call
// lib/cars/lookup.ts which references the same constants — admin writes
// shadow the original entries here, and we expose merged readers for the
// admin pages and the internal API.
//
// TODO Sprint 9+: when a real DB lands, swap the maps for a Prisma client
// and delete the seed shadow. Function signatures stay.

import { BRANDS, DEALER_OFFERS, EXTRA_PRICES, TRIMS } from "@/lib/cars/seed";

// Cross-runtime ID generator. Node's `crypto.randomUUID` is exposed on
// `globalThis.crypto` in Node 19+, the browser, and the Next edge runtime, so
// we look it up there instead of importing `node:crypto` directly. Falling
// back to a timestamp + Math.random suffix keeps the module bundleable
// everywhere (the IDs are only used for in-memory mock data — production
// will swap this for DB-generated primary keys).
function createId(prefix: string): string {
  const c: Crypto | undefined = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") {
    return `${prefix}_${c.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
import type {
  Brand,
  EnergyType,
  Model,
  PriceRecord,
  PriceStatus,
  SourceType,
  Trim,
  VerificationStatus,
} from "@/lib/cars/types";

type CatalogStore = {
  brands: Map<string, Brand>;
  models: Map<string, Model>;
  trims: Map<string, Trim>;
  prices: Map<string, PriceRecord & { price_id: string }>;
};

function deriveModelId(brandId: string, modelName: string): string {
  const slug = modelName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${brandId}__${slug}`;
}

function bootstrap(): CatalogStore {
  const brands = new Map<string, Brand>(
    BRANDS.map((b) => [b.brand_id, { ...b }]),
  );

  const models = new Map<string, Model>();
  for (const trim of TRIMS) {
    const modelId = deriveModelId(trim.brand_id, trim.model_name);
    if (!models.has(modelId)) {
      models.set(modelId, {
        model_id: modelId,
        brand_id: trim.brand_id,
        name: trim.model_name,
        status: "active",
      });
    }
  }

  const trims = new Map<string, Trim>(
    TRIMS.map((t) => [t.trim_id, { ...t }]),
  );

  // Existing seed offers default to "published" so the public site still
  // surfaces them after the offer-status filter lands.
  const prices = new Map<string, PriceRecord & { price_id: string }>();
  const seedPrices: readonly PriceRecord[] = [...DEALER_OFFERS, ...EXTRA_PRICES];
  for (const p of seedPrices) {
    const price_id = p.offer_id ?? createId("price");
    prices.set(price_id, {
      ...p,
      offer_status: p.offer_status ?? (p.dealer_id ? "published" : undefined),
      published_at: p.published_at ?? (p.dealer_id ? p.last_updated : undefined),
      price_id,
    });
  }

  return { brands, models, trims, prices };
}

const g = globalThis as unknown as { __zlq_catalog_store?: CatalogStore };
const store: CatalogStore =
  g.__zlq_catalog_store ?? (g.__zlq_catalog_store = bootstrap());

// ---------- Brands ----------
export function listBrands(): Brand[] {
  return Array.from(store.brands.values()).map((b) => ({ ...b }));
}
export function getBrand(brandId: string): Brand | null {
  const b = store.brands.get(brandId);
  return b ? { ...b } : null;
}
export function createBrand(input: Omit<Brand, "brand_id"> & { brand_id?: string }): Brand {
  const brand_id = input.brand_id ?? createId("brand");
  const brand: Brand = {
    brand_id,
    name: input.name,
    status: input.status ?? "active",
    ...(input.country !== undefined && { country: input.country }),
  };
  store.brands.set(brand_id, brand);
  return { ...brand };
}
export function updateBrand(brandId: string, patch: Partial<Omit<Brand, "brand_id">>): Brand | null {
  const b = store.brands.get(brandId);
  if (!b) return null;
  const next: Brand = { ...b, ...patch };
  store.brands.set(brandId, next);
  return { ...next };
}

// ---------- Models ----------
export function listModels(filter?: { brand_id?: string }): Model[] {
  const all = Array.from(store.models.values());
  const filtered = filter?.brand_id
    ? all.filter((m) => m.brand_id === filter.brand_id)
    : all;
  return filtered.map((m) => ({ ...m }));
}
export function getModel(modelId: string): Model | null {
  const m = store.models.get(modelId);
  return m ? { ...m } : null;
}
export function createModel(input: Omit<Model, "model_id"> & { model_id?: string }): Model {
  const model_id = input.model_id ?? deriveModelId(input.brand_id, input.name);
  const model: Model = {
    model_id,
    brand_id: input.brand_id,
    name: input.name,
    status: input.status ?? "active",
    ...(input.body_type !== undefined && { body_type: input.body_type }),
  };
  store.models.set(model_id, model);
  return { ...model };
}
export function updateModel(modelId: string, patch: Partial<Omit<Model, "model_id">>): Model | null {
  const m = store.models.get(modelId);
  if (!m) return null;
  const next: Model = { ...m, ...patch };
  store.models.set(modelId, next);
  return { ...next };
}

// ---------- Trims ----------
export function listTrims(filter?: { brand_id?: string; energy_type?: EnergyType }): Trim[] {
  let rows = Array.from(store.trims.values());
  if (filter?.brand_id) rows = rows.filter((t) => t.brand_id === filter.brand_id);
  if (filter?.energy_type) rows = rows.filter((t) => t.energy_type === filter.energy_type);
  return rows.map((t) => ({ ...t }));
}
export function getTrim(trimId: string): Trim | null {
  const t = store.trims.get(trimId);
  return t ? { ...t } : null;
}
export function createTrim(input: Omit<Trim, "trim_id"> & { trim_id?: string }): Trim {
  const trim_id = input.trim_id ?? createId("trim");
  const trim: Trim = { ...input, trim_id };
  store.trims.set(trim_id, trim);
  return { ...trim };
}
export function updateTrim(trimId: string, patch: Partial<Omit<Trim, "trim_id">>): Trim | null {
  const t = store.trims.get(trimId);
  if (!t) return null;
  const next: Trim = { ...t, ...patch };
  store.trims.set(trimId, next);
  return { ...next };
}

// ---------- Catalog prices + dealer offers ----------
export type CatalogPriceRecord = PriceRecord & { price_id: string };

export function listPrices(filter?: {
  trim_id?: string;
  dealer_id?: string;
  offers_only?: boolean;
  catalog_only?: boolean;
}): CatalogPriceRecord[] {
  let rows = Array.from(store.prices.values());
  if (filter?.trim_id) rows = rows.filter((p) => p.trim_id === filter.trim_id);
  if (filter?.dealer_id) rows = rows.filter((p) => p.dealer_id === filter.dealer_id);
  if (filter?.offers_only) rows = rows.filter((p) => p.dealer_id != null);
  if (filter?.catalog_only) rows = rows.filter((p) => p.dealer_id == null);
  return rows.map((p) => ({ ...p }));
}

export function getPrice(priceId: string): CatalogPriceRecord | null {
  const p = store.prices.get(priceId);
  return p ? { ...p } : null;
}

export function getOfferById(offerId: string): CatalogPriceRecord | null {
  for (const p of store.prices.values()) {
    if (p.offer_id === offerId) return { ...p };
  }
  return null;
}

export type CreatePriceInput = {
  trim_id: string;
  amount: number;
  currency: PriceRecord["currency"];
  status: PriceStatus;
  source_type: SourceType;
  source_name: string;
  verification_status: VerificationStatus;
  last_updated?: string;
  dealer_id?: string;
  offer_id?: string;
  offer_status?: PriceRecord["offer_status"];
  valid_until?: string | null;
  stock_status?: PriceRecord["stock_status"];
  notes?: string;
  submitted_by?: string;
};

export function createPrice(input: CreatePriceInput): CatalogPriceRecord {
  const price_id = createId("price");
  const offer_id =
    input.offer_id ?? (input.dealer_id ? createId("offer") : undefined);
  const record: CatalogPriceRecord = {
    price_id,
    trim_id: input.trim_id,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    source_type: input.source_type,
    source_name: input.source_name,
    verification_status: input.verification_status,
    last_updated: input.last_updated ?? new Date().toISOString(),
    ...(input.dealer_id !== undefined && { dealer_id: input.dealer_id }),
    ...(offer_id !== undefined && { offer_id }),
    ...(input.offer_status !== undefined && { offer_status: input.offer_status }),
    ...(input.valid_until !== undefined && { valid_until: input.valid_until }),
    ...(input.stock_status !== undefined && { stock_status: input.stock_status }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.submitted_by !== undefined && { submitted_by: input.submitted_by }),
  };
  store.prices.set(price_id, record);
  return { ...record };
}

export function updatePrice(
  priceId: string,
  patch: Partial<Omit<CatalogPriceRecord, "price_id">>,
): CatalogPriceRecord | null {
  const p = store.prices.get(priceId);
  if (!p) return null;
  const next: CatalogPriceRecord = {
    ...p,
    ...patch,
    last_updated: patch.last_updated ?? new Date().toISOString(),
  };
  store.prices.set(priceId, next);
  return { ...next };
}

// Used by review-action endpoints; locates by the offer_id surfaced publicly.
export function updateOfferById(
  offerId: string,
  patch: Partial<Omit<CatalogPriceRecord, "price_id">>,
): CatalogPriceRecord | null {
  for (const [price_id, p] of store.prices.entries()) {
    if (p.offer_id === offerId) {
      return updatePrice(price_id, patch);
    }
  }
  return null;
}
