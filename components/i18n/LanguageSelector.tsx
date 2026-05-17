"use client";

// Sprint 10D: AZ/RU/EN segmented selector. Compact button row that fits the
// Header right-side cluster. Persists choice to localStorage via LocaleProvider.

import { LOCALES, useLocale, type Locale } from "@/lib/i18n/client";
import { FEATURE_I18N_BETA } from "@/lib/env";

const LABEL: Record<Locale, string> = {
  az: "AZ",
  ru: "RU",
  en: "EN",
};

export function LanguageSelector() {
  const { locale, setLocale, ready } = useLocale();

  if (!FEATURE_I18N_BETA) return null;

  return (
    <div
      role="group"
      aria-label="Dil seçimi"
      className="inline-flex h-9 items-center rounded-full border border-border bg-surface p-0.5 text-xs font-semibold"
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            aria-busy={!ready}
            className={`inline-flex h-8 min-w-[2.25rem] items-center justify-center rounded-full px-2 transition-colors ${
              active
                ? "bg-brand text-brand-fg"
                : "text-foreground-soft hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {LABEL[code]}
          </button>
        );
      })}
    </div>
  );
}
