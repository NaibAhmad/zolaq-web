import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { getDealer, listPrices } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { listSubmissions } from "@/lib/dealer/submissions/store";
import { listLeadsForTrims } from "@/lib/leads/store";

export default async function DealerDashboardPage() {
  // Layout has already guarded; session is non-null here.
  const session = (await getDealerSession())!;
  const dealer = getDealer(session.dealerId);
  const offers = listPrices({ dealer_id: session.dealerId, offers_only: true });
  const published = offers.filter((o) => o.offer_status === "published");
  const open = listSubmissions({
    dealer_id: session.dealerId,
    status: ["submitted", "under_review", "needs_revision"],
  });
  const myTrimIds = offers.map((o) => o.trim_id);
  const leads = listLeadsForTrims(myTrimIds);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{dealer?.display_name ?? "Diler paneli"}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Açıq müraciətlər" value={open.length} href="/dealer/submissions" />
        <Kpi label="Aktiv təkliflər" value={published.length} href="/dealer/offers" />
        <Kpi label="Cəmi sorğular" value={leads.length} href="/dealer/leads" />
        <Kpi label="SLA (saat)" value={dealer?.response_sla_hours ?? 0} href="/dealer/profile" />
      </div>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Açıq müraciətlər</h2>
        {open.length === 0 ? (
          <p className="text-sm text-foreground-muted">Açıq müraciət yoxdur.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {open.map((s) => (
              <li
                key={s.submission_id}
                className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0"
              >
                <Link href={`/dealer/submissions`} className="font-medium hover:underline">
                  {s.kind}
                </Link>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block">
      <Card padding="md" interactive>
        <div className="text-xs uppercase tracking-wide text-foreground-muted">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </Card>
    </Link>
  );
}
