// Label copy + helpers for the three permitted ad labels. Used by admin/dealer
// UIs and by the homepage/qa sponsored chips. Every campaign in `active` /
// `paid` / `approved` status must carry a non-null label — enforced in
// lib/ads/store.ts transitionAdStatus.

import type { AdLabel, AdPackageType } from "./types";

export const AD_LABEL_LABEL_AZ: Record<AdLabel, string> = {
  Sponsorlu: "Sponsorlu",
  Reklam: "Reklam",
  Premium: "Premium",
};

export const AD_LABEL_DESCRIPTION_AZ: Record<AdLabel, string> = {
  Sponsorlu: "Diler tərəfindən sponsorlanmış məzmun.",
  Reklam: "Ödənişli reklam mövqeyi.",
  Premium: "Premium tərəfdaş yerləşdirməsi.",
};

export const AD_PACKAGE_LABEL_AZ: Record<AdPackageType, string> = {
  verified_dealer_package: "Təsdiqli diler paketi",
  premium_dealer_profile: "Premium diler profili",
  featured_dealer_placement: "Önə çıxan diler mövqeyi",
  featured_offer: "Önə çıxan təklif",
  sponsored_catalog_card: "Sponsorlu kataloq kartı",
  homepage_sponsored_block: "Ana səhifə sponsorlu blok",
  content_sponsorship: "Məzmun sponsorluğu",
  compare_sponsored_offer: "Müqayisə sponsorlu təklif",
  qa_sponsored_answer: "Sual-cavab sponsorlu cavab",
  bazar_nebzi_sponsored_question: "Bazar Nəbzi sponsorlu sual",
  qualified_lead_package: "Hədəfli sorğu paketi",
  monthly_dealer_insight_report: "Aylıq diler analitika hesabatı",
};

export const AD_PLACEMENT_LABEL_AZ: Record<string, string> = {
  homepage: "Ana səhifə",
  catalog: "Kataloq",
  car_detail: "Maşın detalı",
  compare: "Müqayisə",
  dealer_list: "Diler siyahısı",
  dealer_detail: "Diler detalı",
  news_detail: "Xəbər detalı",
  encyclopedia_detail: "Ensiklopediya detalı",
  qa: "Sual-cavab",
  market_pulse: "Bazar Nəbzi",
};

export const AD_STATUS_LABEL_AZ: Record<string, string> = {
  draft: "Qaralama",
  submitted: "Göndərildi",
  under_review: "Yoxlamada",
  invoice_required: "Faktura tələb olunur",
  invoice_sent: "Faktura göndərildi",
  payment_uploaded: "Ödəniş yükləndi",
  paid: "Ödənildi",
  approved: "Təsdiqləndi",
  active: "Aktiv",
  paused: "Dayandırılıb",
  expired: "Müddəti bitdi",
  rejected: "Rədd edildi",
  cancelled: "Ləğv edildi",
};

// Used by store-level transition guard: any flip into a status that exposes
// the placement to the public must have a label set.
export const AD_PUBLIC_VISIBLE_STATUSES = new Set([
  "approved",
  "active",
  "paused",
  "paid",
]);
