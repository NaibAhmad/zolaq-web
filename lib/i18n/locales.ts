// Sprint 9G: i18n foundation. AZ is the default and source-of-truth locale;
// RU and EN are translation targets. Adding a locale here is a deliberate act
// — every dictionary file under ./translations/common.<locale>.json must exist
// or t() will fall back to AZ at runtime.

export const LOCALES = ["az", "ru", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "az";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
