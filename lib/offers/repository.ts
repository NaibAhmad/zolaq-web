import "server-only";

// Sprint 9B seam — DealerOffer reads/writes live inside the catalog store
// today (lib/admin/catalog-store.ts) under the unified PriceRecord shape.
// This re-export establishes the import path the future per-domain DealerOffer
// cutover will swap to a Prisma implementation. Today it is a pass-through;
// the trim_id-required invariant (R6) is enforced inside createPrice when a
// dealer_id is set, see lib/admin/catalog-store.ts:228.

export {
  listPrices,
  getPrice,
  getOfferById,
  createPrice,
  updatePrice,
  updateOfferById,
  type CatalogPriceRecord,
  type CreatePriceInput,
} from "@/lib/admin/catalog-store";
