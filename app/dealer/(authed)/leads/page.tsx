import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { listPrices } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { listLeadsForTrims } from "@/lib/leads/store";

export default async function DealerLeadsPage() {
  const session = (await getDealerSession())!;
  const offers = listPrices({ dealer_id: session.dealerId, offers_only: true });
  const trimIds = Array.from(new Set(offers.map((o) => o.trim_id)));
  const leads = listLeadsForTrims(trimIds);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Sorğular</h1>
      <Card padding="md">
        <p className="text-sm text-foreground-muted">
          Yalnız sizin komplektasiyalara aid sorğular görünür. Bu səhifə Sprint 8C-də oxumaq üçündür —
          status dəyişikliyi tam CRM ilə Sprint 9-da gələcək.
        </p>
      </Card>
      <AdminTable
        rows={leads}
        rowKey={(l) => l.lead_id}
        empty="Hələ sizə aid sorğu yoxdur."
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
