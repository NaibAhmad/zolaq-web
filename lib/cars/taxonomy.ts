// Sprint 8H: static taxonomies that back advanced-filter dropdowns. Trim
// (komplektasiya) options are NOT here — those come from the data layer
// (lib/cars/lookup.listTrimsForModel). Body types, availability and sort are
// pure UX enums with no per-trim data, so they live here.

export const BODY_TYPES = [
  "sedan",
  "suv",
  "crossover",
  "hatchback",
  "coupe",
  "pickup",
  "van",
  "wagon",
] as const;

export type BodyType = (typeof BODY_TYPES)[number];

export const BODY_TYPE_LABEL: Record<BodyType, string> = {
  sedan: "Sedan",
  suv: "SUV",
  crossover: "Krossover",
  hatchback: "Hetçbek",
  coupe: "Kupe",
  pickup: "Pikap",
  van: "Van",
  wagon: "Universal",
};

export function isBodyType(value: unknown): value is BodyType {
  return (
    typeof value === "string" && (BODY_TYPES as readonly string[]).includes(value)
  );
}

export const AVAILABILITY_OPTIONS = [
  "in_stock",
  "order",
  "coming_soon",
] as const;

export type AvailabilityOption = (typeof AVAILABILITY_OPTIONS)[number];

export const AVAILABILITY_LABEL: Record<AvailabilityOption, string> = {
  in_stock: "Anbarda var",
  order: "Sifarişlə",
  coming_soon: "Tezliklə",
};

export function isAvailabilityOption(value: unknown): value is AvailabilityOption {
  return (
    typeof value === "string" &&
    (AVAILABILITY_OPTIONS as readonly string[]).includes(value)
  );
}

export const SORT_OPTIONS = [
  "recommended",
  "price_asc",
  "price_desc",
  "year_desc",
  "year_asc",
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABEL: Record<SortOption, string> = {
  recommended: "Tövsiyə",
  price_asc: "Qiymət: ucuzdan bahaya",
  price_desc: "Qiymət: bahadan ucuza",
  year_desc: "İl: yenidən köhnəyə",
  year_asc: "İl: köhnədən yeniyə",
};

export function isSortOption(value: unknown): value is SortOption {
  return (
    typeof value === "string" && (SORT_OPTIONS as readonly string[]).includes(value)
  );
}
