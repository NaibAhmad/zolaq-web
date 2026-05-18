// Sprint 10I-C: localized text helper for dynamic / seed-driven content.
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
