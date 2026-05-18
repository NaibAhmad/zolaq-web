import { notFound } from "next/navigation";
import { ApprovalActions } from "@/components/admin/ApprovalActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { getDealer, getOfferById, getTrim } from "@/lib/admin";
import { listAuditLog } from "@/lib/audit/repository";
import { formatDateTimeAz } from "@/lib/format/date";

export default async function AdminOfferDetailPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  const offer = getOfferById(offerId);
  if (!offer) notFound();
  const trim = offer.trim_id ? getTrim(offer.trim_id) : null;
  const dealer = offer.dealer_id ? getDealer(offer.dealer_id) : null;
  const audit = await listAuditLog({ entity_type: "offer", entity_id: offerId, limit: 20 });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Təklif {offer.offer_id}</h1>
        {offer.offer_status ? <StatusBadge status={offer.offer_status} /> : null}
      </header>

      <Card padding="md">
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <Detail label="Komplektasiya" value={trim?.display_name ?? offer.trim_id} />
          <Detail label="Diler" value={dealer?.display_name ?? offer.dealer_id ?? "—"} />
          <Detail
            label="Məbləğ"
            value={`${offer.amount.toLocaleString("az-AZ")} ${offer.currency}`}
          />
          <Detail label="Stok" value={offer.stock_status ?? "—"} />
          <Detail label="Etibarlıdır" value={offer.valid_until ?? "—"} />
          <Detail label="Mənbə" value={`${offer.source_name} (${offer.source_type})`} />
          <Detail label="Təsdiq" value={offer.verification_status} />
          <Detail label="Son redaktə" value={offer.last_updated} />
          {offer.notes ? <Detail label="Qeyd" value={offer.notes} /> : null}
          {offer.review_note ? <Detail label="Reviewer qeydi" value={offer.review_note} /> : null}
        </dl>
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Təsdiq əməliyyatları</h2>
        <ApprovalActions
          approveAction={`/api/internal/offers/${offerId}/approve`}
          rejectAction={`/api/internal/offers/${offerId}/reject`}
          revisionAction={`/api/internal/offers/${offerId}/request-revision`}
          disabled={offer.offer_status === "published"}
        />
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Audit jurnalı</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-foreground-muted">Hadisə yoxdur.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {audit.map((e) => (
              <li key={e.audit_id} className="border-b border-border pb-2 last:border-b-0">
                <div className="font-medium">{e.action}</div>
                <div className="text-xs text-foreground-muted">
                  {e.actor_type}:{e.actor_id} — {formatDateTimeAz(e.created_at)}
                </div>
                {e.note ? <div className="text-xs">{e.note}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
