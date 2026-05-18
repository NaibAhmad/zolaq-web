"use client";

import { ButtonLink } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import type { NextBestAction, NextBestActionCode } from "@/lib/decisions/types";

type Props = {
  action: NextBestAction;
};

const TITLE_KEYS: Record<NextBestActionCode, TranslationKey> = {
  complete_profile: "nextBestAction.completeProfileTitle",
  view_cars: "nextBestAction.viewCarsTitle",
  create_comparison: "nextBestAction.createComparisonTitle",
  request_offer: "nextBestAction.requestOfferTitle",
  request_test_drive: "nextBestAction.requestTestDriveTitle",
  review_offer: "nextBestAction.reviewOfferTitle",
  all_set: "nextBestAction.allSetTitle",
};

const DESCRIPTION_KEYS: Record<NextBestActionCode, TranslationKey> = {
  complete_profile: "nextBestAction.completeProfileDescription",
  view_cars: "nextBestAction.viewCarsDescription",
  create_comparison: "nextBestAction.createComparisonDescription",
  request_offer: "nextBestAction.requestOfferDescription",
  request_test_drive: "nextBestAction.requestTestDriveDescription",
  review_offer: "nextBestAction.reviewOfferDescription",
  all_set: "nextBestAction.allSetDescription",
};

export function NextBestActionCard({ action }: Props) {
  const t = useT();
  return (
    <div className="rounded-[var(--radius-lg)] border border-accent-orange/30 bg-accent-orange-soft p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-orange text-base text-accent-orange-fg"
        >
          →
        </span>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-orange">
            {t("homeDecisionHelper.nextStepEyebrow")}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {t(TITLE_KEYS[action.code])}
          </h3>
          <p className="mt-1 text-sm text-foreground-soft">
            {t(DESCRIPTION_KEYS[action.code])}
          </p>
          {action.href ? (
            <div className="mt-4">
              <ButtonLink href={action.href} variant="primary">
                {t("homeDecisionHelper.continueCta")}
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
