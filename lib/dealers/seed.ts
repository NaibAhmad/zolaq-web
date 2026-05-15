// Dealer seed. Three dealers correspond 1:1 with the dealer_ids already
// referenced by DEALER_OFFERS in lib/cars/seed.ts; verification_status values
// chosen to exercise three different badges visually.

import type { Dealer } from "./types";

export const DEALERS: readonly Dealer[] = [
  {
    dealer_id: "dealer_premium_auto_baku",
    legal_name: "Premium Auto Baku MMC",
    display_name: "Premium Auto Baku",
    verification_status: "official_dealer",
    represented_brands: ["brand_byd", "brand_hongqi"],
    city: "Bakı",
    address: "Heydər Əliyev pr. 152, Bakı",
    working_hours: [
      { days: "Be-Cü", open: "09:00", close: "19:00" },
      { days: "Ş", open: "10:00", close: "17:00" },
    ],
    response_sla_hours: 2,
    services: ["test_drive", "trade_in", "financing", "delivery", "warranty"],
    status: "active",
    source_name: "Zolaq diler bazası",
    updated_at: "2026-05-10T09:00:00+04:00",
  },
  {
    dealer_id: "dealer_nordic_motors_azerbaijan",
    legal_name: "Nordic Motors Azerbaijan MMC",
    display_name: "Nordic Motors Azerbaijan",
    verification_status: "premium_partner",
    represented_brands: ["brand_volvo"],
    city: "Bakı",
    address: "Nobel pr. 24, Bakı",
    working_hours: [
      { days: "Be-Cü", open: "10:00", close: "20:00" },
      { days: "Ş", open: "10:00", close: "18:00" },
    ],
    response_sla_hours: 3,
    services: ["test_drive", "trade_in", "financing", "warranty"],
    status: "active",
    source_name: "Zolaq diler bazası",
    updated_at: "2026-05-08T11:00:00+04:00",
  },
  {
    dealer_id: "dealer_caspian_auto_group",
    legal_name: "Caspian Auto Group MMC",
    display_name: "Caspian Auto Group",
    verification_status: "verified_partner",
    represented_brands: ["brand_toyota", "brand_kia", "brand_hyundai"],
    city: "Bakı",
    address: "Tbilisi pr. 76, Bakı",
    working_hours: [{ days: "Be-Ş", open: "09:30", close: "19:00" }],
    response_sla_hours: 4,
    services: ["test_drive", "trade_in", "financing"],
    status: "active",
    source_name: "Zolaq diler bazası",
    updated_at: "2026-05-05T14:00:00+04:00",
  },
];
