import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { listAuditLog } from "@/lib/audit/repository";
import { formatDateTimeAz } from "@/lib/format/date";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminAuditLogPage() {
  const t = await getServerT();
  const entries = await listAuditLog({ limit: 200 });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminAudit.title")}</h1>
      <p className="text-sm text-foreground-muted">
        {t("adminAudit.description")}
      </p>
      <AdminTable
        rows={entries}
        rowKey={(e) => e.audit_id}
        empty={t("adminAudit.empty")}
        columns={[
          {
            key: "when",
            header: t("adminAudit.time"),
            cell: (e) => formatDateTimeAz(e.created_at),
          },
          {
            key: "actor",
            header: t("adminAudit.actor"),
            cell: (e) => (
              <div className="flex flex-col">
                <Badge tone={e.actor_type === "admin" ? "brand" : e.actor_type === "dealer" ? "blue" : "muted"}>
                  {e.actor_type}
                </Badge>
                <code className="text-xs text-foreground-muted">{e.actor_id}</code>
              </div>
            ),
          },
          { key: "action", header: t("adminAudit.action"), cell: (e) => e.action },
          {
            key: "entity",
            header: t("adminAudit.object"),
            cell: (e) => `${e.entity_type}:${e.entity_id}`,
          },
          { key: "note", header: t("adminAudit.note"), cell: (e) => e.note ?? "—" },
        ]}
      />
    </div>
  );
}
