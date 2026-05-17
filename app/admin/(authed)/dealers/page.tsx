import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listDealers } from "@/lib/admin";
import { DEALER_VERIFICATION_STATUSES } from "@/lib/dealers/types";

export default function AdminDealersPage() {
  const dealers = listDealers();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dilerlər</h1>

      <form
        action="/api/internal/dealers"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-3"
      >
        <Input name="legal_name" label="Hüquqi ad" required />
        <Input name="display_name" label="Görünən ad" required />
        <Input name="city" label="Şəhər" required defaultValue="Bakı" />
        <Input name="address" label="Ünvan" required />
        <Input name="response_sla_hours" label="SLA (saat)" type="number" defaultValue={4} required />
        <Select
          name="verification_status"
          label="Təsdiq statusu"
          required
          defaultValue="pending"
          options={DEALER_VERIFICATION_STATUSES.map((v) => ({ value: v, label: v }))}
        />
        <div className="flex items-end md:col-span-3">
          <Button type="submit">Diler əlavə et</Button>
        </div>
      </form>

      <AdminTable
        rows={dealers}
        rowKey={(d) => d.dealer_id}
        empty="Diler yoxdur."
        columns={[
          {
            key: "name",
            header: "Ad",
            cell: (d) => (
              <Link href={`/admin/dealers/${d.dealer_id}`} className="font-medium hover:underline">
                {d.display_name}
              </Link>
            ),
          },
          { key: "city", header: "Şəhər", cell: (d) => d.city },
          { key: "sla", header: "SLA", cell: (d) => `${d.response_sla_hours}s` },
          { key: "brands", header: "Markalar", cell: (d) => d.represented_brands.join(", ") || "—" },
          { key: "verification", header: "Təsdiq", cell: (d) => <StatusBadge status={d.verification_status} /> },
          { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
        ]}
      />
    </div>
  );
}
