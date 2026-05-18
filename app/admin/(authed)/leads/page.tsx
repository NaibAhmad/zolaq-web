import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { formatDateTimeAz } from "@/lib/format/date";
import { getServerT } from "@/lib/i18n/server";
import { listAllLeads } from "@/lib/leads/store";

export default async function AdminLeadsPage() {
  const t = await getServerT();
  const leads = listAllLeads();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminLeads.title")}</h1>
      <AdminTable
        rows={leads}
        rowKey={(l) => l.lead_id}
        empty={t("dealerLeads.empty")}
        columns={[
          { key: "id", header: t("adminCatalog.idColumn"), cell: (l) => <code className="text-xs">{l.lead_id}</code> },
          { key: "trim", header: t("catalogCard.trim"), cell: (l) => l.trim_id },
          { key: "state", header: t("adminLeads.status"), cell: (l) => <Badge tone="muted">{l.state}</Badge> },
          { key: "surface", header: t("adminCatalog.source"), cell: (l) => l.source_surface },
          { key: "created", header: t("adminLeads.created"), cell: (l) => formatDateTimeAz(l.created_at) },
        ]}
      />
    </div>
  );
}
