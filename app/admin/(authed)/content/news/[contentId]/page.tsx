import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getNews } from "@/lib/content/admin-store";
import { listTrims } from "@/lib/admin";

export default async function AdminNewsEditPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const news = getNews(contentId);
  if (!news) notFound();
  const trims = listTrims();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Xəbər: {news.title}</h1>
        <StatusBadge status={news.status ?? "draft"} />
      </header>
      <form
        action={`/api/internal/content/news/${contentId}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Input name="title" label="Başlıq" defaultValue={news.title} />
        <Input name="slug" label="Slug" defaultValue={news.slug} />
        <Input name="category" label="Kateqoriya" defaultValue={news.category ?? ""} />
        <Input name="source_name" label="Mənbə" defaultValue={news.source_name ?? ""} />
        <Input name="image_url" label="Şəkil URL" defaultValue={news.image_url ?? ""} />
        <Input name="image_alt" label="Şəkil alt" defaultValue={news.image_alt ?? ""} />
        <Textarea name="summary" label="Qısa məzmun" defaultValue={news.summary} />
        <Textarea name="excerpt" label="Excerpt" defaultValue={news.excerpt ?? ""} />
        <Textarea name="body" label="Mətn" defaultValue={news.body} rows={6} />
        <Input
          name="related_trim_ids"
          label="Əlaqəli trim_id-lər (vergüllə)"
          defaultValue={news.related_trim_ids.join(", ")}
          helpText={`Mövcud: ${trims.length} trim`}
        />
        <Input
          name="related_model_reason"
          label="Bağlantı səbəbi"
          defaultValue={news.related_model_reason ?? ""}
        />
        <div className="flex flex-wrap items-end gap-2 md:col-span-2">
          <Button type="submit">Yadda saxla</Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <form action={`/api/internal/content/news/${contentId}/publish`} method="post">
          <Button type="submit" variant="primary">Dərc et</Button>
        </form>
        <form action={`/api/internal/content/news/${contentId}/unpublish`} method="post">
          <Button type="submit" variant="secondary">Yayımdan çıxar</Button>
        </form>
      </div>
    </div>
  );
}
