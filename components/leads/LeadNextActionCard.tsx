"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import type { LeadPrimaryCta } from "@/lib/leads/cta";

type Props = {
  cta: LeadPrimaryCta;
  pending?: boolean;
  onAction: () => void;
};

export function LeadNextActionCard({ cta, pending = false, onAction }: Props) {
  const t = useT();
  const isInfo = cta.variant === "info";
  const isWhatsapp = cta.variant === "whatsapp";

  const wrapClass = isInfo
    ? "rounded-[var(--radius-lg)] border border-border bg-surface p-5"
    : isWhatsapp
      ? "rounded-[var(--radius-lg)] border border-accent-green/30 bg-accent-green-soft p-5"
      : "rounded-[var(--radius-lg)] border border-accent-orange/30 bg-accent-orange-soft p-5";

  const iconClass = isInfo
    ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-foreground-muted text-base"
    : isWhatsapp
      ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-green text-accent-green-fg text-base"
      : "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-orange text-accent-orange-fg text-base";

  const eyebrowClass = isInfo
    ? "text-xs font-semibold uppercase tracking-wide text-foreground-muted"
    : isWhatsapp
      ? "text-xs font-semibold uppercase tracking-wide text-success"
      : "text-xs font-semibold uppercase tracking-wide text-accent-orange";

  const icon = isWhatsapp ? "▶" : isInfo ? "•" : "→";
  const eyebrow = isInfo ? t("leads.statusEyebrow") : t("leads.nextStep");
  const label = t(cta.labelKey);
  const description = t(cta.descriptionKey);

  return (
    <div className={wrapClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex items-start gap-3 md:flex-1">
          <span aria-hidden className={iconClass}>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className={eyebrowClass}>{eyebrow}</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              {label}
            </h3>
            <p className="mt-1 text-sm text-foreground-soft">{description}</p>
          </div>
        </div>
        {!cta.disabled && cta.action ? (
          <div className="md:shrink-0">
            <Button
              variant={isWhatsapp ? "whatsapp" : "primary"}
              size="md"
              fullWidth
              disabled={pending}
              onClick={onAction}
            >
              {pending ? t("leads.sending") : label}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
