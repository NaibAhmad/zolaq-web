"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

type Props = {
  sourceLanguageLabel?: string;
  className?: string;
};

// Sprint 10I-D: surface for content that doesn't have a localized version in
// the user's selected locale. Lets the user click a "Translate" button that
// switches to a "translation is being prepared" message. We do NOT call any
// translation API — this is a calm, honest, demo-safe placeholder.
export function TranslationNotice({
  sourceLanguageLabel,
  className,
}: Props) {
  const t = useT();
  const [requested, setRequested] = useState(false);

  return (
    <div
      role="note"
      className={[
        "flex flex-col gap-2 rounded-[var(--radius-md)] border border-accent-orange/30 bg-accent-orange-soft/30 px-4 py-3 text-sm text-foreground",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-orange">
        {t("translationNotice.heading")}
      </p>
      {requested ? (
        <p className="text-sm text-foreground-soft">
          {t("translationNotice.preparing")}
        </p>
      ) : (
        <>
          <p className="text-sm text-foreground-soft">
            {sourceLanguageLabel
              ? t("translationNotice.bodyWithSource", {
                  source: sourceLanguageLabel,
                })
              : t("translationNotice.body")}
          </p>
          <div>
            <button
              type="button"
              onClick={() => setRequested(true)}
              className="inline-flex items-center rounded-full bg-accent-orange px-4 py-1.5 text-xs font-semibold text-accent-orange-fg transition-colors hover:brightness-110"
            >
              {t("translationNotice.cta")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
