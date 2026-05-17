import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listBrands } from "@/lib/admin";
import { getGeneration } from "@/lib/generations/repository";

export default async function AdminGenerationEditPage({
  params,
}: {
  params: Promise<{ generationId: string }>;
}) {
  const { generationId } = await params;
  const generation = getGeneration(generationId);
  if (!generation) notFound();
  const brands = listBrands();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Nəsil: {generation.display_name}</h1>

      <form
        action={`/api/internal/generations/${generation.generation_id}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Select
          name="brand_id"
          label="Marka"
          defaultValue={generation.brand_id}
          options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
        />
        <Input
          name="model_name"
          label="Model adı"
          defaultValue={generation.model_name}
        />
        <Input name="name" label="Nəsil adı" defaultValue={generation.name} />
        <Input
          name="display_name"
          label="Görünən ad"
          defaultValue={generation.display_name}
        />
        <Input
          name="production_year_from"
          label="İstehsal ili, başlanğıc"
          type="number"
          defaultValue={generation.production_year_from}
        />
        <Input
          name="production_year_to"
          label="İstehsal ili, bitiş"
          type="number"
          defaultValue={generation.production_year_to ?? ""}
        />
        <Select
          name="status"
          label="Status"
          defaultValue={generation.status}
          options={[
            { value: "active", label: "Aktiv" },
            { value: "inactive", label: "Deaktiv" },
          ]}
        />
        <Input name="source" label="Mənbə" defaultValue={generation.source ?? ""} />
        <Input
          name="verification_status"
          label="Təsdiq statusu"
          defaultValue={generation.verification_status ?? ""}
        />
        <div className="flex items-end md:col-span-2">
          <Button type="submit">Yadda saxla</Button>
        </div>
      </form>

      <form
        action={`/api/internal/generations/${generation.generation_id}`}
        method="post"
        className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"
      >
        <input type="hidden" name="_method" value="delete" />
        <p className="mb-3 text-sm text-foreground-muted">
          Arxivləmə nəsli istifadədə olan komplektasiyalar üçün təhlükəsizdir
          (status “Deaktiv”ə düşür). Hard delete yalnız heç bir trim referansı
          yoxdursa baş tutur.
        </p>
        <Button type="submit" variant="ghost">
          Arxivlə
        </Button>
      </form>
    </div>
  );
}
