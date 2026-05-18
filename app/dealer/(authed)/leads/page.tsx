import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { listPrices } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { formatDateTimeAz } from "@/lib/format/date";
import { getServerT } from "@/lib/i18n/server";
import { listLeadsForTrims } from "@/lib/leads/store";

export default async function DealerLeadsPage() {
  const session = (await getDealerSession())!;
  const t = await getServerT();
  const offers = listPrices({ dealer_id: session.dealerId, offers_only: true });
  const trimIds = Array.from(new Set(offers.map((o) => o.trim_id)));
  const leads = listLeadsForTrims(trimIds);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("dealerLeads.title")}</h1>
      <Card padding="md">
        <p className="text-sm text-foreground-muted">
          {t("dealerLeads.infoBanner")}
        </p>
      </Card>
      <AdminTable
        rows={leads}
        rowKey={(l) => l.lead_id}
        empty={t("dealerLeads.empty")}
        columns={[
          { key: "id", header: t("adminCatalog.idColumn"), cell: (l) => <code className="text-xs">{l.lead_id}</code> },
          { key: "trim", header: t("catalogCard.trim"), cell: (l) => l.trim_id },
          { key: "state", header: t("adminLeads.status"), cell: (l) => <Badge tone="muted">{l.state}</Badge> },
          { key: "created", header: t("adminLeads.created"), cell: (l) => formatDateTimeAz(l.created_at) },
        ]}
      />
    </div>
  );
}
