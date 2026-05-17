import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { listAuditLog } from "@/lib/audit/repository";

export default async function AdminAuditLogPage() {
  const entries = await listAuditLog({ limit: 200 });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Audit jurnalı</h1>
      <p className="text-sm text-foreground-muted">
        Son 200 hadisə. Hər admin/diler əməliyyatı, təsdiq, dərc və müraciət dəyişikliyi burada görünür.
      </p>
      <AdminTable
        rows={entries}
        rowKey={(e) => e.audit_id}
        empty="Hələ audit hadisəsi yoxdur."
        columns={[
          {
            key: "when",
            header: "Vaxt",
            cell: (e) => new Date(e.created_at).toLocaleString(),
          },
          {
            key: "actor",
            header: "Aktor",
            cell: (e) => (
              <div className="flex flex-col">
                <Badge tone={e.actor_type === "admin" ? "brand" : e.actor_type === "dealer" ? "blue" : "muted"}>
                  {e.actor_type}
                </Badge>
                <code className="text-xs text-foreground-muted">{e.actor_id}</code>
              </div>
            ),
          },
          { key: "action", header: "Əməliyyat", cell: (e) => e.action },
          {
            key: "entity",
            header: "Obyekt",
            cell: (e) => `${e.entity_type}:${e.entity_id}`,
          },
          { key: "note", header: "Qeyd", cell: (e) => e.note ?? "—" },
        ]}
      />
    </div>
  );
}
