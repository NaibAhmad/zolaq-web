// Maps any of the internal status enums to a Badge tone so admin tables show a
// consistent pill across offers, submissions, and content.

import { Badge, type BadgeTone } from "@/components/ui/Badge";
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

const LABEL: Record<string, string> = {
  draft: "Qaralama",
  submitted: "Göndərildi",
  under_review: "Yoxlamada",
  needs_revision: "Düzəliş tələbi",
  approved: "Təsdiqləndi",
  published: "Dərc edildi",
  rejected: "Rədd edildi",
  expired: "Müddəti bitdi",
  cancelled: "Ləğv edildi",
  unpublished: "Yayımdan çıxarıldı",
  official_dealer: "Rəsmi diler",
  premium_partner: "Premium tərəfdaş",
  verified_partner: "Təsdiq olunmuş tərəfdaş",
  pending: "Gözləmədə",
  active: "Aktiv",
  inactive: "Deaktiv",
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  const key = String(status);
  return <Badge tone={TONE[key] ?? "neutral"}>{LABEL[key] ?? key}</Badge>;
}
