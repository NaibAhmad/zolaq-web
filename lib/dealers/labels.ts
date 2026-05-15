// Azerbaijani labels + Tailwind tones for dealer verification and services.
// Tone classes reuse existing tokens (--brand, --success, --warning, --danger,
// --accent-blue, etc.); no new design.

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
