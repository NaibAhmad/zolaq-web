// Market Intelligence — public module surface (Sprint 10J foundation).
//
// Data types + deterministic utilities + clearly-labelled demo data. NO public
// UI is wired in Sprint 10J. Consumers must respect the locked trust rule
// (DealerOfferData ≠ CatalogPrice ≠ MarketSignal) documented in ./types.ts and
// the no-speculative-language rule from docs/sprint-10i/.

export * from "./types";
export * from "./constants";
export { calculateInterestScore } from "./interest-score";
export { calculatePriceMovement } from "./price-movement";
export { deriveConfidenceLevel, requiresDisclaimer } from "./confidence";
export {
  DEMO_INTEREST_INPUTS,
  DEMO_CATALOG_SNAPSHOTS,
  DEMO_DEALER_SNAPSHOTS,
} from "./mock-data";
