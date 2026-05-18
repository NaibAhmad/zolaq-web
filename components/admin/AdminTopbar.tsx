"use client";

// Static top bar for /admin/* — shows current role + name, logout button.

import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import type { AdminSession } from "@/lib/auth/admin-session";

const ROLE_KEY: Record<AdminSession["role"], TranslationKey> = {
  super_admin: "adminNav.roleSuperAdmin",
  internal_ops_admin: "adminNav.roleInternalOps",
  content_manager: "adminNav.roleContentManager",
  sales_lead_manager: "adminNav.roleSalesLead",
  moderator: "adminNav.roleModerator",
};

export function AdminTopbar({ session }: { session: AdminSession }) {
  const t = useT();
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">{session.name}</span>
        <Badge tone="brand">{t(ROLE_KEY[session.role])}</Badge>
      </div>
      <form action="/api/admin/auth/logout" method="post">
        <button
          type="submit"
          className="text-xs font-medium uppercase tracking-wide text-foreground-muted hover:text-foreground"
        >
          {t("adminNav.signOut")}
        </button>
      </form>
    </header>
  );
}
