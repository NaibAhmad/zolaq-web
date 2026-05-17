// Sprint 9G: public surface of the i18n module. Import from "@/lib/i18n" only;
// reaching into ./translations or ./t directly bypasses the type-safe key
// derivation in ./types.

export { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from "./locales";
export { t } from "./t";
export type { TranslationDictionary, TranslationKey, TranslationParams } from "./types";
