import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { getSession } from "@/lib/auth/session";
import { otpHref } from "@/lib/routes";

// Defense-in-depth: proxy.ts is the primary guard for /profile/*. This layout
// re-checks in case the matcher misses a path or the cookie was tampered.
export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect(otpHref({ purpose: "profile_access", next: "/profile" }));
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileBottomNav />
    </>
  );
}
