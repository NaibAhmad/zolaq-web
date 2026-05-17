import "server-only";

// Sprint 9B foundation seam. This is the import path future domain cutovers
// will swap to a Prisma-backed implementation. THIS SPRINT it re-exports the
// existing globalThis store unchanged — no behavioural change, no risk to
// Sprint 8H read paths. See docs/sprint-9b/REPOSITORY_CUTOVER_STATUS.md.

export {
  // brands
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  // models
  listModels,
  getModel,
  createModel,
  updateModel,
  // trims
  listTrims,
  getTrim,
  createTrim,
  updateTrim,
  // prices + offers
  listPrices,
  getPrice,
  getOfferById,
  createPrice,
  updatePrice,
  updateOfferById,
  type CatalogPriceRecord,
  type CreatePriceInput,
} from "@/lib/admin/catalog-store";

// Trim specs are introduced this sprint (Sprint 9C). They live in their own
// globalThis store so the catalog-store stays minimal — see lib/catalog/trim-specs-store.ts.
export {
  getTrimSpec,
  upsertTrimSpec,
  type TrimSpec,
  type TrimSpecInput,
} from "./trim-specs-store";
