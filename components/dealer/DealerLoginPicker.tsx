// Dev-only login picker for the dealer panel.

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { getServerT } from "@/lib/i18n/server";
import type { Dealer } from "@/lib/dealers/types";

export async function DealerLoginPicker({
  dealers,
  redirectTo,
}: {
  dealers: Dealer[];
  redirectTo?: string;
}) {
  const t = await getServerT();
  return (
    <form
      action="/api/dealer/auth/login"
      method="post"
      className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6"
    >
      {redirectTo ? (
        <input type="hidden" name="redirect_to" value={redirectTo} />
      ) : null}
      <Select
        name="dealer_id"
        label={t("auth.dealerLabel")}
        options={dealers.map((d) => ({
          value: d.dealer_id,
          label: `${d.display_name} — ${d.city}`,
        }))}
        defaultValue={dealers[0]?.dealer_id ?? ""}
        required
      />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {t("auth.dealerContact")}
        </span>
        <input
          name="contact_name"
          type="text"
          required
          placeholder={t("auth.yourName")}
          className="h-11 rounded-[var(--radius)] border border-border bg-surface px-3 text-sm"
          defaultValue={t("auth.dealerRep")}
        />
      </label>
      <Button type="submit" fullWidth>
        {t("auth.signIn")}
      </Button>
      <p className="text-xs text-foreground-muted">
        {t("auth.devModeNotice")}
      </p>
    </form>
  );
}
