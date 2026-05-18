// Encyclopedia category labels.
// Sprint 10I-D: added EN/RU tables + locale helper. Enum keys are stable;
// only the human-readable labels move through the i18n layer.

import type { Locale } from "@/lib/i18n/locales";
import type { EncyclopediaCategory } from "./types";

export const ENCYCLOPEDIA_CATEGORY_LABELS: Record<
  EncyclopediaCategory,
  string
> = {
  tech: "Texnologiya",
  battery: "Batareya",
  driving: "Sürüş",
  finance: "Maliyyə",
  charging: "Şarj",
  insurance: "Sığorta",
};

const ENCYCLOPEDIA_CATEGORY_LABELS_EN: Record<EncyclopediaCategory, string> = {
  tech: "Technology",
  battery: "Battery",
  driving: "Driving",
  finance: "Finance",
  charging: "Charging",
  insurance: "Insurance",
};

const ENCYCLOPEDIA_CATEGORY_LABELS_RU: Record<EncyclopediaCategory, string> = {
  tech: "Технологии",
  battery: "Аккумулятор",
  driving: "Вождение",
  finance: "Финансы",
  charging: "Зарядка",
  insurance: "Страховка",
};

const CATEGORY_BY_LOCALE: Record<
  Locale,
  Record<EncyclopediaCategory, string>
> = {
  az: ENCYCLOPEDIA_CATEGORY_LABELS,
  en: ENCYCLOPEDIA_CATEGORY_LABELS_EN,
  ru: ENCYCLOPEDIA_CATEGORY_LABELS_RU,
};

const GENERIC_BY_LOCALE: Record<Locale, string> = {
  az: "Ümumi",
  en: "General",
  ru: "Общее",
};

const ALL_BY_LOCALE: Record<Locale, string> = {
  az: "Hamısı",
  en: "All",
  ru: "Все",
};

export const ENCYCLOPEDIA_CATEGORY_ORDER: readonly EncyclopediaCategory[] = [
  "tech",
  "battery",
  "driving",
  "finance",
  "charging",
  "insurance",
];

export const ENCYCLOPEDIA_ALL_LABEL = "Hamısı";
export const ENCYCLOPEDIA_GENERIC_LABEL = "Ümumi";

export function categoryLabel(
  category: EncyclopediaCategory | undefined,
  locale: Locale = "az",
): string {
  if (!category) return GENERIC_BY_LOCALE[locale] ?? ENCYCLOPEDIA_GENERIC_LABEL;
  return (
    CATEGORY_BY_LOCALE[locale]?.[category] ??
    ENCYCLOPEDIA_CATEGORY_LABELS[category]
  );
}

export function encyclopediaAllLabel(locale: Locale): string {
  return ALL_BY_LOCALE[locale] ?? ENCYCLOPEDIA_ALL_LABEL;
}

export function encyclopediaGenericLabel(locale: Locale): string {
  return GENERIC_BY_LOCALE[locale] ?? ENCYCLOPEDIA_GENERIC_LABEL;
}
