import { redirect } from "next/navigation";
import { DealerSidebar } from "@/components/dealer/DealerSidebar";
import { DealerTopbar } from "@/components/dealer/DealerTopbar";
import { getDealer } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { listSubmissions } from "@/lib/dealer/submissions/store";

export default async function DealerAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDealerSession();
  if (!session) {
    redirect("/dealer/login");
  }

  const dealer = getDealer(session.dealerId);
  const open = listSubmissions({
    dealer_id: session.dealerId,
    status: ["submitted", "under_review", "needs_revision"],
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DealerSidebar />
      <div className="flex flex-1 flex-col">
        <DealerTopbar
          session={session}
          dealer={dealer}
          openSubmissions={open.length}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
