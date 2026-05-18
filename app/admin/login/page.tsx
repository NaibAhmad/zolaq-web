import { redirect } from "next/navigation";
import { PasswordSignInForm } from "@/components/auth/PasswordSignInForm";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { listAdmins } from "@/lib/admin/store";
import { getAdminSession } from "@/lib/auth/admin-session";
import { DEV_AUTH_MODE } from "@/lib/env";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAdminSession();
  const sp = await searchParams;
  if (session) {
    redirect(sp.next ?? "/admin/dashboard");
  }
  const t = await getServerT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-center text-xl font-semibold">{t("auth.adminPanel")}</h1>
        <PasswordSignInForm
          panel="admin"
          endpoint="/api/admin/auth/login"
          redirectTo={sp.next}
        />
        {DEV_AUTH_MODE ? (
          <div className="flex flex-col gap-2">
            <p className="text-center text-xs uppercase tracking-wide text-foreground-muted">
              {t("auth.orMockSignIn")}
            </p>
            <RoleSwitcher admins={listAdmins()} redirectTo={sp.next} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
