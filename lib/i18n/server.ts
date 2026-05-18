import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";
import { t } from "./t";
import type { TranslationKey, TranslationParams } from "./types";

// Sprint 10I-C: server-side locale resolution.
//
// Locale lives in two places:
//   1. localStorage (client only, used by useT() in ./client.tsx)
//   2. The `zolaq-locale` cookie (readable by both client and server)
//
// setLocale() in ./client.tsx writes both, so any server component can render
// the same language the user just selected. Falls back to AZ when the cookie
// is missing or holds an unknown value — keeps behavior identical to the
// client-side useT() fallback semantics.

export const LOCALE_COOKIE = "zolaq-locale";

export async function getServerLocale(): Promise<Locale> {
  try {
    const jar = await cookies();
    const raw = jar.get(LOCALE_COOKIE)?.value;
    if (raw && isLocale(raw)) return raw;
  } catch {
    // cookies() throws outside a request scope (e.g. during build). Stay AZ.
  }
  return DEFAULT_LOCALE;
}

// Convenience wrapper: resolves the current locale once and returns a bound
// t() so server components can call `const t = await getServerT(); t("nav.cars")`
// without juggling locale arguments.
export async function getServerT(): Promise<
  (key: TranslationKey, params?: TranslationParams) => string
> {
  const locale = await getServerLocale();
  return (key, params) => t(key, locale, params);
}
