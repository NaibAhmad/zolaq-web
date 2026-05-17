"use client";

// Sprint 10D: client-side companion to the server-only t() in ./t.ts. This
// module is additive — the server t() keeps working for every existing call
// site. Use this module only inside "use client" components that need to
// react to a runtime locale change.
//
// Scope this sprint: Header nav labels + homepage Quick Search title/subtitle.
// Everything else stays AZ-only. See docs/sprint-10/I18N_BETA_SCOPE.md.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "./locales";
import type {
  TranslationDictionary,
  TranslationKey,
  TranslationParams,
} from "./types";

import commonAz from "./translations/common.az.json";
import commonRu from "./translations/common.ru.json";
import commonEn from "./translations/common.en.json";

const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  az: commonAz,
  ru: commonRu as TranslationDictionary,
  en: commonEn as TranslationDictionary,
};

const STORAGE_KEY = "zolaq-locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && isLocale(stored) ? stored : null;
  } catch {
    // localStorage unavailable (private mode, disabled storage); stay AZ.
    return null;
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // SSR / first paint always uses DEFAULT_LOCALE so server and client markup
  // match. The stored preference is applied after hydration through a
  // storage subscription so the effect body only reacts to external changes.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function syncFromStorage() {
      const stored = readStoredLocale();
      setLocaleState(stored ?? DEFAULT_LOCALE);
      setReady(true);
    }
    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Best-effort persist; selection still applies for this tab.
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, ready }),
    [locale, setLocale, ready],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error(
      "useLocale must be used inside <LocaleProvider>. Wrap the surface in a " +
        "LocaleProvider (NEXT_PUBLIC_FEATURE_I18N_BETA=true) or use the " +
        "server t() helper from @/lib/i18n instead.",
    );
  }
  return ctx;
}

// Mirror the server t() lookup + AZ fallback semantics in ./t.ts so the two
// helpers behave identically for the same key.
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

export function useT(): (key: TranslationKey, params?: TranslationParams) => string {
  const { locale } = useLocale();
  return useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const [section, leaf] = key.split(".") as [
        keyof TranslationDictionary,
        string,
      ];
      const localized = lookup(DICTIONARIES[locale], section, leaf);
      const value =
        localized ?? lookup(DICTIONARIES[DEFAULT_LOCALE], section, leaf) ?? key;
      return params ? interpolate(value, params) : value;
    },
    [locale],
  );
}

export { LOCALES, DEFAULT_LOCALE };
export type { Locale };
