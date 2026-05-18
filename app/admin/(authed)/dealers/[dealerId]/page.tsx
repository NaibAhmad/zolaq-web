import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getDealer, listBrands, listPrices } from "@/lib/admin";
import { listSubmissions } from "@/lib/dealer/submissions/store";
import { DEALER_VERIFICATION_STATUSES } from "@/lib/dealers/types";
import { formatDateTimeAz } from "@/lib/format/date";

const SERVICE_OPTIONS = ["test_drive", "trade_in", "financing", "delivery", "warranty"] as const;

export default async function AdminDealerEditPage({
  params,
}: {
  params: Promise<{ dealerId: string }>;
}) {
  const { dealerId } = await params;
  const dealer = getDealer(dealerId);
  if (!dealer) notFound();
  const brands = listBrands();
  const offers = listPrices({ dealer_id: dealerId, offers_only: true });
  const submissions = listSubmissions({ dealer_id: dealerId });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{dealer.display_name}</h1>
        <StatusBadge status={dealer.verification_status} />
      </header>

      <form
        action={`/api/internal/dealers/${dealer.dealer_id}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Input name="legal_name" label="Hüquqi ad" defaultValue={dealer.legal_name} />
        <Input name="display_name" label="Görünən ad" defaultValue={dealer.display_name} />
        <Input name="city" label="Şəhər" defaultValue={dealer.city} />
        <Input name="address" label="Ünvan" defaultValue={dealer.address} />
        <Input
          name="response_sla_hours"
          label="SLA (saat)"
          type="number"
          defaultValue={dealer.response_sla_hours}
        />
        <Select
          name="verification_status"
          label="Təsdiq statusu"
          defaultValue={dealer.verification_status}
          options={DEALER_VERIFICATION_STATUSES.map((v) => ({ value: v, label: v }))}
        />
        <Select
          name="status"
          label="Status"
          defaultValue={dealer.status}
          options={[
            { value: "active", label: "Aktiv" },
            { value: "inactive", label: "Deaktiv" },
          ]}
        />
        <Textarea
          name="represented_brands"
          label="Təmsil edilən markalar (vergüllə)"
          defaultValue={dealer.represented_brands.join(", ")}
          helpText={`Movcud: ${brands.map((b) => b.brand_id).join(", ")}`}
        />
        <Textarea
          name="services"
          label="Xidmətlər (vergüllə)"
          defaultValue={dealer.services.join(", ")}
          helpText={SERVICE_OPTIONS.join(", ")}
        />
        <Textarea
          name="working_hours_json"
          label="İş saatları (JSON)"
          defaultValue={JSON.stringify(dealer.working_hours)}
          helpText='[{"days":"Be-Cü","open":"09:00","close":"19:00"}]'
        />
        <div className="flex items-end md:col-span-2">
          <Button type="submit">Yadda saxla</Button>
        </div>
      </form>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Diler təklifləri ({offers.length})</h2>
        {offers.length === 0 ? (
          <p className="text-sm text-foreground-muted">Bu dilerin təklifi yoxdur.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {offers.map((o) => (
              <li key={o.price_id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0">
                <span>{o.trim_id} — {o.amount.toLocaleString("az-AZ")} {o.currency}</span>
                {o.offer_status ? <StatusBadge status={o.offer_status} /> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Müraciətlər ({submissions.length})</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-foreground-muted">Müraciət yoxdur.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {submissions.map((s) => (
              <li key={s.submission_id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0">
                <span>{s.kind} — {formatDateTimeAz(s.created_at)}</span>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
