import {
  DEALER_VERIFICATION_LABEL_AZ,
  DEALER_VERIFICATION_TONE,
} from "@/lib/dealers/labels";
import type { DealerVerificationStatus } from "@/lib/dealers/types";

type Props = {
  status: DealerVerificationStatus;
};

export function DealerVerificationBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${DEALER_VERIFICATION_TONE[status]}`}
      aria-label={DEALER_VERIFICATION_LABEL_AZ[status]}
    >
      {DEALER_VERIFICATION_LABEL_AZ[status]}
    </span>
  );
}
