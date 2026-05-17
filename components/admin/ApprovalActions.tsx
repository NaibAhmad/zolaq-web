// Renders three forms posting to approve/reject/request-revision endpoints.
// Used on /admin/offers/[offerId] and /admin/dealers/[dealerId] (for dealer
// profile submissions). Server-side endpoints write audit log entries.

import { Button } from "@/components/ui/Button";

type Props = {
  approveAction: string;
  rejectAction: string;
  revisionAction: string;
  disabled?: boolean;
};

export function ApprovalActions({
  approveAction,
  rejectAction,
  revisionAction,
  disabled,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <form action={approveAction} method="post">
        <Button type="submit" variant="primary" disabled={disabled}>
          Təsdiqlə
        </Button>
      </form>
      <form
        action={revisionAction}
        method="post"
        className="flex flex-wrap items-end gap-2"
      >
        <label className="flex flex-col gap-1 text-xs text-foreground-muted">
          <span>Düzəliş qeydi</span>
          <input
            name="note"
            type="text"
            className="h-9 w-64 rounded-[var(--radius)] border border-border bg-surface px-3 text-sm"
            placeholder="Dilerə qeyd"
            required
          />
        </label>
        <Button type="submit" variant="secondary" disabled={disabled}>
          Düzəliş tələb et
        </Button>
      </form>
      <form
        action={rejectAction}
        method="post"
        className="flex flex-wrap items-end gap-2"
      >
        <label className="flex flex-col gap-1 text-xs text-foreground-muted">
          <span>Rədd səbəbi</span>
          <input
            name="note"
            type="text"
            className="h-9 w-64 rounded-[var(--radius)] border border-border bg-surface px-3 text-sm"
            placeholder="Səbəb"
            required
          />
        </label>
        <Button type="submit" variant="danger" disabled={disabled}>
          Rədd et
        </Button>
      </form>
    </div>
  );
}
