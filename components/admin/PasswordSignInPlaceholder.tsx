import { getServerT } from "@/lib/i18n/server";

// Sprint 9E: shown on /admin/login and /dealer/login when DEV_AUTH_MODE is
// off (i.e. every production deploy, until Sprint 9F wires real password
// sign-in). Renders no form — there is nothing for an unauthenticated visitor
// to submit. Pure server component, no client JS.

export async function PasswordSignInPlaceholder({
  panel,
}: {
  panel: "admin" | "dealer";
}) {
  const t = await getServerT();
  const title =
    panel === "admin" ? t("auth.adminPanelTitle") : t("auth.dealerPanelTitle");
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-sm">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-foreground-muted">
        {t("adminLoginPlaceholder.comingSoon")}
      </p>
      <p className="text-xs text-foreground-muted">
        {t("adminLoginPlaceholder.mockNotice")}
      </p>
    </div>
  );
}
