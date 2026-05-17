import "server-only";

import { DEFAULT_LOCALE, type Locale } from "./locales";
import type { TranslationDictionary, TranslationKey, TranslationParams } from "./types";

import commonAz from "./translations/common.az.json";
import commonRu from "./translations/common.ru.json";
import commonEn from "./translations/common.en.json";

const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  az: commonAz,
  ru: commonRu as TranslationDictionary,
  en: commonEn as TranslationDictionary,
};

// Sprint 9G: server-only translation lookup. Falls back to AZ (the source of
// truth) when a key is missing in the target locale — keeps untranslated UI
// readable rather than showing the raw key. Component wiring is deferred to a
// later sprint; today every consumer should pass DEFAULT_LOCALE.
export function t(key: TranslationKey, locale: Locale = DEFAULT_LOCALE, params?: TranslationParams): string {
  const [section, leaf] = key.split(".") as [keyof TranslationDictionary, string];
  const localized = lookup(DICTIONARIES[locale], section, leaf);
  const value =
    localized ?? lookup(DICTIONARIES[DEFAULT_LOCALE], section, leaf) ?? key;
  return params ? interpolate(value, params) : value;
}

function lookup(
  dict: TranslationDictionary,
  section: keyof TranslationDictionary,
  leaf: string,
): string | undefined {
  const branch = dict[section] as Record<string, string> | undefined;
  if (!branch) return undefined;
  const value = branch[leaf];
  return typeof value === "string" ? value : undefined;
}

function interpolate(template: string, params: TranslationParams): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}
