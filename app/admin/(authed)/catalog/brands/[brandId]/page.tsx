import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getBrand } from "@/lib/admin";

export default async function AdminBrandEditPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = getBrand(brandId);
  if (!brand) notFound();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Marka: {brand.name}</h1>
      <form
        action={`/api/internal/brands/${brand.brand_id}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Input name="name" label="Ad" required defaultValue={brand.name} />
        <Input name="country" label="Ölkə" defaultValue={brand.country ?? ""} />
        <Select
          name="status"
          label="Status"
          defaultValue={brand.status}
          options={[
            { value: "active", label: "Aktiv" },
            { value: "inactive", label: "Deaktiv" },
          ]}
        />
        <div className="flex items-end md:col-span-2">
          <Button type="submit">Yadda saxla</Button>
        </div>
      </form>
    </div>
  );
}
