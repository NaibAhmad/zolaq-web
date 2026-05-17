import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { listAllLeads } from "@/lib/leads/store";

export default function AdminLeadsPage() {
  const leads = listAllLeads();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Sorğular</h1>
      <AdminTable
        rows={leads}
        rowKey={(l) => l.lead_id}
        empty="Hələ sorğu yoxdur."
        columns={[
          { key: "id", header: "ID", cell: (l) => <code className="text-xs">{l.lead_id}</code> },
          { key: "trim", header: "Komplektasiya", cell: (l) => l.trim_id },
          { key: "state", header: "Status", cell: (l) => <Badge tone="muted">{l.state}</Badge> },
          { key: "surface", header: "Mənbə", cell: (l) => l.source_surface },
          { key: "created", header: "Yaradılıb", cell: (l) => new Date(l.created_at).toLocaleString() },
        ]}
      />
    </div>
  );
}
