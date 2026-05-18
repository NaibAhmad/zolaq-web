// Dev-only login picker for the admin panel. Posts to /api/admin/auth/login
// with the chosen admin_id. TODO Sprint 8E: replace with real auth.

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";
import type { AdminUser } from "@/lib/admin/types";

const ROLE_KEY: Record<AdminUser["role"], TranslationKey> = {
  super_admin: "adminNav.roleSuperAdmin",
  internal_ops_admin: "adminNav.roleInternalOps",
  content_manager: "adminNav.roleContentManager",
  sales_lead_manager: "adminNav.roleSalesLead",
  moderator: "adminNav.roleModerator",
};

export async function RoleSwitcher({
  admins,
  redirectTo,
}: {
  admins: AdminUser[];
  redirectTo?: string;
}) {
  const t = await getServerT();
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
        label={t("adminLoginPlaceholder.adminAccount")}
        options={admins.map((a) => ({
          value: a.admin_id,
          label: `${a.name} — ${t(ROLE_KEY[a.role])}`,
        }))}
        defaultValue={admins[0]?.admin_id ?? ""}
        required
        helpText={t("auth.devModeNotice")}
      />
      <Button type="submit" fullWidth>
        {t("auth.signIn")}
      </Button>
    </form>
  );
}
