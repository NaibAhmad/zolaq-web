import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { listDealers, listPrices } from "@/lib/admin";
import { listAuditLog } from "@/lib/audit/repository";
import { listSubmissions } from "@/lib/dealer/submissions/store";
import { listNews, listEncyclopedia, listQA } from "@/lib/content/admin-store";

export default async function AdminDashboardPage() {
  const pendingOffers = listPrices({ offers_only: true }).filter(
    (p) =>
      p.offer_status === "submitted" ||
      p.offer_status === "under_review" ||
      p.offer_status === "needs_revision",
  );
  const pendingSubmissions = listSubmissions({
    status: ["submitted", "under_review", "needs_revision"],
  });
  const pendingDealers = listDealers().filter((d) => d.verification_status === "pending");
  const draftContent = [
    ...listNews({ status: "draft" }),
    ...listEncyclopedia({ status: "draft" }),
    ...listQA({ status: "draft" }),
  ];
  const recentAudit = await listAuditLog({ limit: 10 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Admin paneli</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Açıq müraciətlər" value={pendingSubmissions.length} href="/admin/offers" />
        <KpiCard label="Yoxlanılan təkliflər" value={pendingOffers.length} href="/admin/offers" />
        <KpiCard label="Pending dilerlər" value={pendingDealers.length} href="/admin/dealers" />
        <KpiCard label="Qaralama məzmun" value={draftContent.length} href="/admin/content/news" />
      </div>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Son audit hadisələri</h2>
        {recentAudit.length === 0 ? (
          <p className="text-sm text-foreground-muted">Hələ heç bir hadisə yoxdur.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {recentAudit.map((e) => (
              <li key={e.audit_id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0">
                <div className="flex flex-col">
                  <span className="font-medium">{e.action}</span>
                  <span className="text-xs text-foreground-muted">
                    {e.actor_type}:{e.actor_id} → {e.entity_type}:{e.entity_id}
                  </span>
                </div>
                <span className="text-xs text-foreground-muted">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Yoxlanmaq üçün təkliflər</h2>
        {pendingOffers.length === 0 ? (
          <p className="text-sm text-foreground-muted">Bütün təkliflər təmizdir.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {pendingOffers.slice(0, 6).map((o) => (
              <li key={o.price_id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0">
                <Link href={`/admin/offers/${o.offer_id ?? o.price_id}`} className="font-medium hover:underline">
                  {o.trim_id} — {o.source_name}
                </Link>
                <StatusBadge status={o.offer_status ?? "draft"} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function KpiCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block">
      <Card padding="md" interactive>
        <div className="text-xs uppercase tracking-wide text-foreground-muted">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </Card>
    </Link>
  );
}
