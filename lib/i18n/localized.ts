// Sprint 10I-C: localized text helper for dynamic / seed-driven content.
// Sprint 10I-D: extended with hasLocalizedText / getContentLanguage so the
// translation-notice surface can detect missing locales and report which
// language is actually being shown.
//
// Many surfaces render content that comes from data (seed files, JSON tables)
// rather than translation dictionaries. The classic example is Bazar Nəbzi
// topic questions and option labels. This helper lets that content carry a
// {az,en,ru} object instead of a plain string while still accepting plain
// strings for fields that should never be translated (brand/model/dealer
// proper names).
//
// Rules:
//   - Plain string → returned as-is. Use this for proper nouns.
//   - Object → looked up by locale, with AZ fallback if the target locale is
//     missing. Same fallback semantics as t() in ./t.ts and useT() in
//     ./client.tsx so behavior is consistent across all surfaces.

import { DEFAULT_LOCALE, type Locale } from "./locales";

export type LocalizedText =
  | string
  | { az: string; en?: string; ru?: string };

export function getLocalizedText(value: LocalizedText, locale: Locale): string {
  if (typeof value === "string") return value;
  const direct = value[locale];
  if (typeof direct === "string" && direct.length > 0) return direct;
  return value[DEFAULT_LOCALE] ?? "";
}

export function getLocalizedOptionLabel<T extends { label: LocalizedText }>(
  option: T,
  locale: Locale,
): string {
  return getLocalizedText(option.label, locale);
}

// Sprint 10I-D: returns true when the value already carries text for the
// requested locale (either as a plain string — which we treat as locale-
// neutral/already-rendered, or as an object whose locale slot is non-empty).
// Used by TranslationNotice / LocalizedContentBlock to decide whether to
// surface the "translation in preparation" UI.
export function hasLocalizedText(
  value: LocalizedText | undefined | null,
  locale: Locale,
): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.length > 0;
  const direct = value[locale];
  return typeof direct === "string" && direct.length > 0;
}

// Sprint 10I-D: returns the locale actually used when getLocalizedText() is
// called with the same value/locale pair. Plain strings are reported as the
// default locale because that is the demo convention — author-written prose
// without a locale wrapper is treated as AZ.
export function getContentLanguage(
  value: LocalizedText | undefined | null,
  locale: Locale,
): Locale {
  if (value === undefined || value === null) return DEFAULT_LOCALE;
  if (typeof value === "string") return DEFAULT_LOCALE;
  const direct = value[locale];
  if (typeof direct === "string" && direct.length > 0) return locale;
  return DEFAULT_LOCALE;
}
