import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getEncyclopedia } from "@/lib/content/admin-store";
import { ENCYCLOPEDIA_CATEGORIES } from "@/lib/content/types";

export default async function AdminEncyclopediaEditPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const entry = getEncyclopedia(contentId);
  if (!entry) notFound();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{entry.title}</h1>
        <StatusBadge status={entry.status ?? "draft"} />
      </header>
      <form
        action={`/api/internal/content/encyclopedia/${contentId}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Input name="title" label="Başlıq" defaultValue={entry.title} />
        <Input name="slug" label="Slug" defaultValue={entry.slug} />
        <Select
          name="category"
          label="Kateqoriya"
          defaultValue={entry.category ?? ""}
          placeholderOption="—"
          options={ENCYCLOPEDIA_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Input name="image_url" label="Şəkil URL" defaultValue={entry.image_url ?? ""} />
        <Input name="image_alt" label="Şəkil alt" defaultValue={entry.image_alt ?? ""} />
        <Input
          name="source_name"
          label="Mənbə adı"
          defaultValue={entry.source?.name ?? ""}
        />
        <Textarea name="summary" label="Qısa məzmun" defaultValue={entry.summary} />
        <Textarea name="excerpt" label="Excerpt" defaultValue={entry.excerpt ?? ""} />
        <Textarea name="body" label="Mətn" defaultValue={entry.body} rows={6} />
        <Input
          name="related_trim_ids"
          label="Əlaqəli trim_id-lər (vergüllə)"
          defaultValue={entry.related_trim_ids.join(", ")}
        />
        <Input
          name="related_model_reason"
          label="Bağlantı səbəbi"
          defaultValue={entry.related_model_reason ?? ""}
        />
        <div className="flex flex-wrap items-end gap-2 md:col-span-2">
          <Button type="submit">Yadda saxla</Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <form action={`/api/internal/content/encyclopedia/${contentId}/publish`} method="post">
          <Button type="submit" variant="primary">Dərc et</Button>
        </form>
        <form action={`/api/internal/content/encyclopedia/${contentId}/unpublish`} method="post">
          <Button type="submit" variant="secondary">Yayımdan çıxar</Button>
        </form>
      </div>
    </div>
  );
}
