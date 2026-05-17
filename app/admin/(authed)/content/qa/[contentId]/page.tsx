import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getQA } from "@/lib/content/admin-store";

export default async function AdminQAEditPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const qa = getQA(contentId);
  if (!qa) notFound();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sual: {qa.id}</h1>
        <StatusBadge status={qa.status ?? "draft"} />
      </header>
      <form
        action={`/api/internal/content/qa/${contentId}`}
        method="post"
        className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
      >
        <input type="hidden" name="_method" value="patch" />
        <Input name="question" label="Sual" defaultValue={qa.question} />
        <Textarea name="answer" label="Cavab" defaultValue={qa.answer} rows={6} />
        <Input
          name="related_trim_ids"
          label="Əlaqəli trim_id-lər (vergüllə)"
          defaultValue={qa.related_trim_ids.join(", ")}
        />
        <div>
          <Button type="submit">Yadda saxla</Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <form action={`/api/internal/content/qa/${contentId}/publish`} method="post">
          <Button type="submit" variant="primary">Təsdiqlə və dərc et</Button>
        </form>
        <form action={`/api/internal/content/qa/${contentId}/unpublish`} method="post">
          <Button type="submit" variant="danger">Spam / yayımdan çıxar</Button>
        </form>
      </div>
    </div>
  );
}
