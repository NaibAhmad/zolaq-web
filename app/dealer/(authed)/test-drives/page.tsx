import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { listPrices } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { listLeadsForTrims } from "@/lib/leads/store";

export default async function DealerTestDrivesPage() {
  // Test-drive leads are leads with state involving "test_drive" — for the
  // mock, we simply filter dealer leads by states that imply test-drive flow.
  const session = (await getDealerSession())!;
  const offers = listPrices({ dealer_id: session.dealerId, offers_only: true });
  const trimIds = Array.from(new Set(offers.map((o) => o.trim_id)));
  const leads = listLeadsForTrims(trimIds).filter((l) =>
    String(l.state).includes("test_drive"),
  );
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Test-sürüş sorğuları</h1>
      <Card padding="md">
        <p className="text-sm text-foreground-muted">
          Yalnız oxumaq üçün. Test-sürüş rezervi tam CRM ilə Sprint 9+ daxilində gələcək.
        </p>
      </Card>
      <AdminTable
        rows={leads}
        rowKey={(l) => l.lead_id}
        empty="Test-sürüş sorğusu yoxdur."
        columns={[
          { key: "id", header: "ID", cell: (l) => <code className="text-xs">{l.lead_id}</code> },
          { key: "trim", header: "Komplektasiya", cell: (l) => l.trim_id },
          { key: "state", header: "Status", cell: (l) => <Badge tone="muted">{l.state}</Badge> },
          { key: "created", header: "Yaradılıb", cell: (l) => new Date(l.created_at).toLocaleString() },
        ]}
      />
    </div>
  );
}
