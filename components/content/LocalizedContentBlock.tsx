"use client";

import { TranslationNotice } from "@/components/i18n/TranslationNotice";
import { useCurrentLocale } from "@/lib/i18n/client";
import {
  getContentLanguage,
  getLocalizedText,
  hasLocalizedText,
  type LocalizedText,
} from "@/lib/i18n/localized";

type Props = {
  value: LocalizedText | undefined | null;
  as?: "p" | "div" | "span" | "h1" | "h2" | "h3" | "h4";
  className?: string;
  // When the localized value is missing, show the AZ fallback below the
  // translation notice so the founder demo never goes blank.
  showFallback?: boolean;
};

const LOCALE_LABEL: Record<string, string> = {
  az: "AZ",
  en: "EN",
  ru: "RU",
};

// Sprint 10I-D: renders a piece of LocalizedText. If the value lacks a
// translation for the active locale, the user sees a TranslationNotice plus
// (optionally) the AZ source so the page never silently shows a foreign
// language without explanation.
export function LocalizedContentBlock({
  value,
  as: As = "p",
  className,
  showFallback = true,
}: Props) {
  const locale = useCurrentLocale();
  if (value === undefined || value === null) return null;

  const text = getLocalizedText(value, locale);
  const haveLocale = hasLocalizedText(value, locale);
  const renderedLocale = getContentLanguage(value, locale);

  if (haveLocale) {
    return <As className={className}>{text}</As>;
  }

  // Missing translation for active locale → notice + AZ fallback (dimmed).
  return (
    <div className="flex flex-col gap-3">
      <TranslationNotice sourceLanguageLabel={LOCALE_LABEL[renderedLocale]} />
      {showFallback ? (
        <As className={[className ?? "", "text-foreground-muted"].join(" ").trim()}>
          {text}
        </As>
      ) : null}
    </div>
  );
}
