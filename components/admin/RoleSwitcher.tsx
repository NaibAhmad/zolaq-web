// Dev-only login picker for the admin panel. Posts to /api/admin/auth/login
// with the chosen admin_id. TODO Sprint 8E: replace with real auth.

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { AdminUser } from "@/lib/admin/types";

const ROLE_LABEL: Record<AdminUser["role"], string> = {
  super_admin: "Master Admin",
  internal_ops_admin: "Daxili əməliyyatlar",
  content_manager: "Məzmun meneceri",
  sales_lead_manager: "Sorğu meneceri",
  moderator: "Moderator",
};

export function RoleSwitcher({
  admins,
  redirectTo,
}: {
  admins: AdminUser[];
  redirectTo?: string;
}) {
  return (
    <form
      action="/api/admin/auth/login"
      method="post"
      className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6"
    >
      {redirectTo ? (
        <input type="hidden" name="redirect_to" value={redirectTo} />
      ) : null}
      <Select
        name="admin_id"
        label="Admin hesabı"
        options={admins.map((a) => ({
          value: a.admin_id,
          label: `${a.name} — ${ROLE_LABEL[a.role]}`,
        }))}
        defaultValue={admins[0]?.admin_id ?? ""}
        required
        helpText="Sprint 8A: parol yoxdur — Sprint 8E real auth gətirəcək."
      />
      <Button type="submit" fullWidth>
        Daxil ol
      </Button>
    </form>
  );
}
