import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getDealer, listBrands } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { getServerT } from "@/lib/i18n/server";

export default async function DealerProfilePage() {
  const session = (await getDealerSession())!;
  const dealer = getDealer(session.dealerId);
  if (!dealer) notFound();
  const brands = listBrands();
  const t = await getServerT();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("dealerProfile.title")}</h1>
        <StatusBadge status={dealer.verification_status} />
      </header>

      <Card padding="md">
        <p className="text-sm text-foreground-muted">{t("dealerProfile.helperBannerLong")}</p>
      </Card>

      <form
        action="/api/dealer/profile"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <Input name="legal_name" label={t("dealerProfile.legalName")} defaultValue={dealer.legal_name} />
        <Input name="display_name" label={t("dealerProfile.displayName")} defaultValue={dealer.display_name} />
        <Input name="city" label={t("dealerProfile.city")} defaultValue={dealer.city} />
        <Input name="address" label={t("dealerProfile.address")} defaultValue={dealer.address} />
        <Input
          name="response_sla_hours"
          label={t("dealerProfile.slaHours")}
          type="number"
          defaultValue={dealer.response_sla_hours}
        />
        <Textarea
          name="represented_brands"
          label={t("dealerProfile.brandsLabel")}
          defaultValue={dealer.represented_brands.join(", ")}
          helpText={t("dealerProfile.brandsHelpAvailable", { brands: brands.map((b) => b.brand_id).join(", ") })}
        />
        <Textarea
          name="services"
          label={t("dealerProfile.servicesLabel")}
          defaultValue={dealer.services.join(", ")}
          helpText={t("dealerProfile.servicesHelp")}
        />
        <Textarea
          name="working_hours_json"
          label={t("dealerProfile.hoursJsonLabel")}
          defaultValue={JSON.stringify(dealer.working_hours)}
          helpText={t("dealerProfile.hoursJsonExample")}
        />
        <div className="flex items-end md:col-span-2">
          <Button type="submit">{t("dealerProfile.submitForReview")}</Button>
        </div>
      </form>
    </div>
  );
}
