// Top bar for /dealer/*. Shows dealer name + open-submission summary.

import { Badge } from "@/components/ui/Badge";
import { getServerT } from "@/lib/i18n/server";
import type { Dealer } from "@/lib/dealers/types";
import type { DealerSession } from "@/lib/auth/dealer-session";

type Props = {
  session: DealerSession;
  dealer: Dealer | null;
  openSubmissions: number;
};

export async function DealerTopbar({ session, dealer, openSubmissions }: Props) {
  const t = await getServerT();
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {dealer?.display_name ?? session.dealerId}
          </span>
          {dealer ? (
            <Badge tone="muted">{dealer.city}</Badge>
          ) : null}
        </div>
        <span className="text-xs text-foreground-muted">{session.contactName}</span>
      </div>
      <div className="flex items-center gap-3">
        {openSubmissions > 0 ? (
          <Badge tone="warning">
            {t("dealerNav.openSubmissionsCount", { count: openSubmissions })}
          </Badge>
        ) : (
          <Badge tone="success">{t("dealerNav.noOpenSubmissions")}</Badge>
        )}
        <form action="/api/dealer/auth/logout" method="post">
          <button
            type="submit"
            className="text-xs font-medium uppercase tracking-wide text-foreground-muted hover:text-foreground"
          >
            {t("dealerNav.signOut")}
          </button>
        </form>
      </div>
    </header>
  );
}
