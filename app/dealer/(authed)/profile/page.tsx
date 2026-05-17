import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getDealer, listBrands } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";

export default async function DealerProfilePage() {
  const session = (await getDealerSession())!;
  const dealer = getDealer(session.dealerId);
  if (!dealer) notFound();
  const brands = listBrands();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profil</h1>
        <StatusBadge status={dealer.verification_status} />
      </header>

      <Card padding="md">
        <p className="text-sm text-foreground-muted">
          Profil dəyişiklikləri müraciət (submission) yaradır və admin tərəfindən təsdiqlənənədək
          publik saytda görünmür.
        </p>
      </Card>

      <form
        action="/api/dealer/profile"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
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
        <Textarea
          name="represented_brands"
          label="Təmsil edilən markalar (vergüllə brand_id-lər)"
          defaultValue={dealer.represented_brands.join(", ")}
          helpText={`Mövcud: ${brands.map((b) => b.brand_id).join(", ")}`}
        />
        <Textarea
          name="services"
          label="Xidmətlər (vergüllə)"
          defaultValue={dealer.services.join(", ")}
          helpText="test_drive, trade_in, financing, delivery, warranty"
        />
        <Textarea
          name="working_hours_json"
          label="İş saatları (JSON)"
          defaultValue={JSON.stringify(dealer.working_hours)}
          helpText='[{"days":"Be-Cü","open":"09:00","close":"19:00"}]'
        />
        <div className="flex items-end md:col-span-2">
          <Button type="submit">Yoxlamaya göndər</Button>
        </div>
      </form>
    </div>
  );
}
