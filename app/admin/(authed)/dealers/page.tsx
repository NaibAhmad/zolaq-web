import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listDealers } from "@/lib/admin";
import { DEALER_VERIFICATION_STATUSES } from "@/lib/dealers/types";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminDealersPage() {
  const dealers = listDealers();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminDealers.title")}</h1>

      <form
        action="/api/internal/dealers"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-3"
      >
        <Input name="legal_name" label={t("adminDealers.legalName")} required />
        <Input name="display_name" label={t("adminDealers.displayName")} required />
        <Input
          name="city"
          label={t("adminDealers.city")}
          required
          defaultValue={t("adminDealers.baku")}
        />
        <Input name="address" label={t("adminDealers.address")} required />
        <Input
          name="response_sla_hours"
          label={t("adminDealers.slaHours")}
          type="number"
          defaultValue={4}
          required
        />
        <Select
          name="verification_status"
          label={t("adminDealers.approvalStatus")}
          required
          defaultValue="pending"
          options={DEALER_VERIFICATION_STATUSES.map((v) => ({ value: v, label: v }))}
        />
        <div className="flex items-end md:col-span-3">
          <Button type="submit">{t("adminDealers.addDealer")}</Button>
        </div>
      </form>

      <AdminTable
        rows={dealers}
        rowKey={(d) => d.dealer_id}
        empty={t("adminDealers.empty")}
        columns={[
          {
            key: "name",
            header: t("adminCatalog.name"),
            cell: (d) => (
              <Link href={`/admin/dealers/${d.dealer_id}`} className="font-medium hover:underline">
                {d.display_name}
              </Link>
            ),
          },
          { key: "city", header: t("adminDealers.city"), cell: (d) => d.city },
          {
            key: "sla",
            header: t("adminDealers.slaShort"),
            cell: (d) => t("adminDealers.slaCell", { hours: d.response_sla_hours }),
          },
          {
            key: "brands",
            header: t("adminDealers.brands"),
            cell: (d) => d.represented_brands.join(", ") || "—",
          },
          {
            key: "verification",
            header: t("adminDealers.approval"),
            cell: (d) => <StatusBadge status={d.verification_status} />,
          },
          {
            key: "status",
            header: t("adminDealers.status"),
            cell: (d) => <StatusBadge status={d.status} />,
          },
        ]}
      />
    </div>
  );
}
