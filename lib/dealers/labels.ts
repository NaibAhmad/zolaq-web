// Azerbaijani labels + Tailwind tones for dealer verification and services.
// Tone classes reuse existing tokens (--brand, --success, --warning, --danger,
// --accent-blue, etc.); no new design.
// Sprint 10I-D: added EN/RU sibling tables + locale helpers.

import type { Locale } from "@/lib/i18n/locales";
import type { DealerService, DealerVerificationStatus } from "./types";

export const DEALER_VERIFICATION_LABEL_AZ: Record<
  DealerVerificationStatus,
  string
> = {
  official_dealer: "Rəsmi diler",
  verified_partner: "Təsdiqlənmiş tərəfdaş",
  premium_partner: "Premium tərəfdaş",
  pending: "Yoxlanılır",
  rejected: "Rədd edilib",
  expired: "Müddəti bitib",
};

const DEALER_VERIFICATION_LABEL_EN: Record<
  DealerVerificationStatus,
  string
> = {
  official_dealer: "Official dealer",
  verified_partner: "Verified partner",
  premium_partner: "Premium partner",
  pending: "In review",
  rejected: "Rejected",
  expired: "Expired",
};

const DEALER_VERIFICATION_LABEL_RU: Record<
  DealerVerificationStatus,
  string
> = {
  official_dealer: "Официальный дилер",
  verified_partner: "Подтверждённый партнёр",
  premium_partner: "Премиум-партнёр",
  pending: "На проверке",
  rejected: "Отклонено",
  expired: "Срок истёк",
};

const DEALER_VERIFICATION_BY_LOCALE: Record<
  Locale,
  Record<DealerVerificationStatus, string>
> = {
  az: DEALER_VERIFICATION_LABEL_AZ,
  en: DEALER_VERIFICATION_LABEL_EN,
  ru: DEALER_VERIFICATION_LABEL_RU,
};

export function dealerVerificationLabel(
  status: DealerVerificationStatus,
  locale: Locale,
): string {
  return (
    DEALER_VERIFICATION_BY_LOCALE[locale]?.[status] ??
    DEALER_VERIFICATION_LABEL_AZ[status]
  );
}

export const DEALER_VERIFICATION_TONE: Record<
  DealerVerificationStatus,
  string
> = {
  official_dealer: "border-success/40 bg-success/10 text-success",
  verified_partner: "border-accent-blue/40 bg-accent-blue/10 text-accent-blue",
  premium_partner: "border-brand/40 bg-brand/10 text-brand",
  pending: "border-warning/40 bg-warning/10 text-warning",
  rejected: "border-danger/40 bg-danger/10 text-danger",
  expired: "border-foreground-muted/40 bg-surface text-foreground-muted",
};

export const DEALER_SERVICE_LABEL_AZ: Record<DealerService, string> = {
  test_drive: "Test-sürüş",
  trade_in: "Trade-in",
  financing: "Kredit",
  delivery: "Çatdırılma",
  warranty: "Zəmanət",
};

const DEALER_SERVICE_LABEL_EN: Record<DealerService, string> = {
  test_drive: "Test drive",
  trade_in: "Trade-in",
  financing: "Financing",
  delivery: "Delivery",
  warranty: "Warranty",
};

const DEALER_SERVICE_LABEL_RU: Record<DealerService, string> = {
  test_drive: "Тест-драйв",
  trade_in: "Trade-in",
  financing: "Кредит",
  delivery: "Доставка",
  warranty: "Гарантия",
};

const DEALER_SERVICE_BY_LOCALE: Record<
  Locale,
  Record<DealerService, string>
> = {
  az: DEALER_SERVICE_LABEL_AZ,
  en: DEALER_SERVICE_LABEL_EN,
  ru: DEALER_SERVICE_LABEL_RU,
};

export function dealerServiceLabel(
  service: DealerService,
  locale: Locale,
): string {
  return (
    DEALER_SERVICE_BY_LOCALE[locale]?.[service] ??
    DEALER_SERVICE_LABEL_AZ[service]
  );
}
