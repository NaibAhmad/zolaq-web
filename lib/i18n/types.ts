// Sprint 9G: shared types for the i18n layer. The dictionary shape is derived
// from common.az.json (AZ is the source of truth) so a missing/renamed key in
// AZ becomes a TS error at every t() call site, not a silent runtime fallback.

import type commonAz from "./translations/common.az.json";

export type TranslationDictionary = typeof commonAz;

// Recursive key path: e.g. "nav.cars", "auth.codeInvalid".
// Limited to two levels (section.key) because that's the dictionary shape we
// committed to in docs/sprint-9a/I18N_MULTILINGUAL_ARCHITECTURE.md §3.
export type TranslationKey = {
  [Section in keyof TranslationDictionary]: TranslationDictionary[Section] extends Record<string, string>
    ? `${Section & string}.${keyof TranslationDictionary[Section] & string}`
    : never;
}[keyof TranslationDictionary];

export type TranslationParams = Record<string, string | number>;
