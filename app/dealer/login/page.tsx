import { redirect } from "next/navigation";
import { PasswordSignInForm } from "@/components/auth/PasswordSignInForm";
import { DealerLoginPicker } from "@/components/dealer/DealerLoginPicker";
import { listDealers } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { DEV_AUTH_MODE } from "@/lib/env";
import { getServerT } from "@/lib/i18n/server";

export default async function DealerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getDealerSession();
  const sp = await searchParams;
  if (session) {
    redirect(sp.next ?? "/dealer/dashboard");
  }
  const t = await getServerT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-center text-xl font-semibold">{t("auth.dealerPanel")}</h1>
        <PasswordSignInForm
          panel="dealer"
          endpoint="/api/dealer/auth/login"
          redirectTo={sp.next}
        />
        {DEV_AUTH_MODE ? (
          <div className="flex flex-col gap-2">
            <p className="text-center text-xs uppercase tracking-wide text-foreground-muted">
              {t("auth.orMockSignIn")}
            </p>
            <DealerLoginPicker dealers={listDealers()} redirectTo={sp.next} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
