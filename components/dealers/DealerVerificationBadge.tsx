"use client";

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { dealerVerificationLabel } from "@/lib/dealers/labels";
import { useCurrentLocale } from "@/lib/i18n/client";
import type { DealerVerificationStatus } from "@/lib/dealers/types";

type Props = {
  status: DealerVerificationStatus;
  size?: "sm" | "md";
  variant?: "on-light" | "on-dark";
};

const TONE: Record<DealerVerificationStatus, BadgeTone> = {
  official_dealer: "success",
  verified_partner: "blue",
  premium_partner: "brand",
  pending: "warning",
  rejected: "danger",
  expired: "muted",
};

export function DealerVerificationBadge({
  status,
  size = "sm",
  variant = "on-light",
}: Props) {
  const locale = useCurrentLocale();
  const tone: BadgeTone =
    variant === "on-dark" ? "on-dark" : TONE[status];
  return (
    <Badge tone={tone} size={size}>
      {dealerVerificationLabel(status, locale)}
    </Badge>
  );
}
