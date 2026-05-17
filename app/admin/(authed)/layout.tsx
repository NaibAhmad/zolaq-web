import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { getAdminSession } from "@/lib/auth/admin-session";

// Route group `(authed)` wraps every protected admin page. /admin/login lives
// outside this group so it can render without the chrome and without the auth
// check below.

export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar role={session.role} />
      <div className="flex flex-1 flex-col">
        <AdminTopbar session={session} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
