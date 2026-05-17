// Static top bar for /admin/* — shows current role + name, logout button.

import { Badge } from "@/components/ui/Badge";
import type { AdminSession } from "@/lib/auth/admin-session";

const ROLE_LABEL: Record<AdminSession["role"], string> = {
  super_admin: "Master Admin",
  internal_ops_admin: "Daxili əməliyyatlar",
  content_manager: "Məzmun meneceri",
  sales_lead_manager: "Sorğu meneceri",
  moderator: "Moderator",
};

export function AdminTopbar({ session }: { session: AdminSession }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">{session.name}</span>
        <Badge tone="brand">{ROLE_LABEL[session.role]}</Badge>
      </div>
      <form action="/api/admin/auth/logout" method="post">
        <button
          type="submit"
          className="text-xs font-medium uppercase tracking-wide text-foreground-muted hover:text-foreground"
        >
          Çıxış
        </button>
      </form>
    </header>
  );
}
