// Market Intelligence — demo / beta data (Sprint 10J foundation).
//
// ⚠️  EVERY value here is illustrative DEMO data, NOT real market behavior.
// All interest inputs carry is_demo: true so calculateInterestScore returns
// confidence_level "beta_signal", and price snapshots carry confidence_level
// "beta_signal". Nothing here may be presented as a hard fact, and there is no
// public UI consuming it in Sprint 10J. Trim IDs reference existing seed trims
// in lib/cars/seed.ts so a future internal preview can resolve display names.

import type { InterestScoreInput, PriceSnapshot } from "./types";

// Demo interest inputs. Realistic shapes, clearly seeded (is_demo: true).
export const DEMO_INTEREST_INPUTS: InterestScoreInput[] = [
  {
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    detail_views: 320,
    saved_count: 41,
    compare_adds: 28,
    qa_activity: 12,
    bazar_pulse_participation: 18,
    official_price_requests: 9,
    test_drive_clicks: 7,
    dealer_offer_clicks: 11,
    vin_interest: 6,
    previous_7d_raw_score: 540,
    is_demo: true,
  },
  {
    trim_id: "trim_demo_growing_model",
    detail_views: 90,
    saved_count: 14,
    compare_adds: 9,
    qa_activity: 4,
    bazar_pulse_participation: 5,
    official_price_requests: 3,
    test_drive_clicks: 2,
    dealer_offer_clicks: 2,
    vin_interest: 1,
    previous_7d_raw_score: 120,
    is_demo: true,
  },
  {
    // Sparse input → low/insufficient confidence even before the demo gate.
    trim_id: "trim_demo_sparse_model",
    detail_views: 6,
    saved_count: 1,
    compare_adds: 0,
    qa_activity: 0,
    bazar_pulse_participation: 0,
    official_price_requests: 0,
    test_drive_clicks: 0,
    dealer_offer_clicks: 0,
    vin_interest: 0,
    is_demo: true,
  },
];

// Demo CATALOG-category price snapshots for one trim across a 90-day span.
// Single source category → safe to compute movement. Mixing these with the
// dealer snapshots below would (correctly) be refused by calculatePriceMovement.
export const DEMO_CATALOG_SNAPSHOTS: PriceSnapshot[] = [
  {
    snapshot_id: "snap_demo_catalog_1",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    amount: 78500,
    currency: "AZN",
    source_type: "catalog",
    source_name: "Zolaq Catalog (demo)",
    verification_status: "verified",
    captured_at: "2026-02-20T09:00:00+04:00",
    price_status: "catalog_price",
    confidence_level: "beta_signal",
  },
  {
    snapshot_id: "snap_demo_catalog_2",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    amount: 79200,
    currency: "AZN",
    source_type: "catalog",
    source_name: "Zolaq Catalog (demo)",
    verification_status: "verified",
    captured_at: "2026-03-25T09:00:00+04:00",
    price_status: "catalog_price",
    confidence_level: "beta_signal",
  },
  {
    snapshot_id: "snap_demo_catalog_3",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    amount: 80100,
    currency: "AZN",
    source_type: "catalog",
    source_name: "Zolaq Catalog (demo)",
    verification_status: "verified",
    captured_at: "2026-05-10T09:00:00+04:00",
    price_status: "catalog_price",
    confidence_level: "beta_signal",
  },
];

// Demo DEALER-OFFER-category snapshots — a DISTINCT category. Present only to
// demonstrate that the two categories are NOT blended. DealerOfferData is
// private to a lead and never aggregated into a public market trend.
export const DEMO_DEALER_SNAPSHOTS: PriceSnapshot[] = [
  {
    snapshot_id: "snap_demo_dealer_1",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    amount: 77000,
    currency: "AZN",
    source_type: "official_dealer",
    source_name: "Demo Dealer (demo)",
    verification_status: "verified",
    captured_at: "2026-04-01T09:00:00+04:00",
    price_status: "dealer_official_offer",
    confidence_level: "beta_signal",
  },
  {
    snapshot_id: "snap_demo_dealer_2",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    amount: 76500,
    currency: "AZN",
    source_type: "official_dealer",
    source_name: "Demo Dealer (demo)",
    verification_status: "verified",
    captured_at: "2026-05-05T09:00:00+04:00",
    price_status: "dealer_official_offer",
    confidence_level: "beta_signal",
  },
];
