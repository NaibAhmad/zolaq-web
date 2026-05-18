"use client";

// Maps any of the internal status enums to a Badge tone so admin tables show a
// consistent pill across offers, submissions, and content.

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import type { OfferStatus } from "@/lib/cars/types";
import type { ContentStatus } from "@/lib/content/types";
import type { SubmissionStatus } from "@/lib/dealer/submissions/types";
import type { DealerVerificationStatus } from "@/lib/dealers/types";

type AnyStatus =
  | OfferStatus
  | SubmissionStatus
  | ContentStatus
  | DealerVerificationStatus
  | "active"
  | "inactive";

const TONE: Record<string, BadgeTone> = {
  // workflow
  draft: "muted",
  submitted: "blue",
  under_review: "warning",
  needs_revision: "warning",
  approved: "success",
  published: "success",
  rejected: "danger",
  expired: "muted",
  cancelled: "muted",
  // content
  unpublished: "muted",
  // dealer verification
  official_dealer: "success",
  premium_partner: "brand",
  verified_partner: "blue",
  pending: "warning",
  // generic entity status
  active: "success",
  inactive: "muted",
};

function statusKey(status: string): TranslationKey | null {
  const allowed = new Set([
    "draft",
    "submitted",
    "under_review",
    "needs_revision",
    "approved",
    "published",
    "rejected",
    "expired",
    "cancelled",
    "unpublished",
    "official_dealer",
    "premium_partner",
    "verified_partner",
    "pending",
    "active",
    "inactive",
  ]);
  if (!allowed.has(status)) return null;
  return `adminStatus.${status}` as TranslationKey;
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  const t = useT();
  const key = String(status);
  const trKey = statusKey(key);
  return (
    <Badge tone={TONE[key] ?? "neutral"}>{trKey ? t(trKey) : key}</Badge>
  );
}
