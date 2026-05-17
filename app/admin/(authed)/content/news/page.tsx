import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { listNews } from "@/lib/content/admin-store";

export default function AdminNewsPage() {
  const items = listNews();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Xəbərlər</h1>
      <form
        action="/api/internal/content/news"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <Input name="title" label="Başlıq" required />
        <Input name="slug" label="Slug" required placeholder="kebab-case" />
        <div className="md:col-span-2">
          <Button type="submit">Qaralama yarat</Button>
        </div>
      </form>
      <AdminTable
        rows={items}
        rowKey={(n) => n.content_id}
        empty="Xəbər yoxdur."
        columns={[
          {
            key: "title",
            header: "Başlıq",
            cell: (n) => (
              <Link href={`/admin/content/news/${n.content_id}`} className="font-medium hover:underline">
                {n.title}
              </Link>
            ),
          },
          { key: "slug", header: "Slug", cell: (n) => <code className="text-xs">{n.slug}</code> },
          { key: "category", header: "Kateqoriya", cell: (n) => n.category ?? "—" },
          { key: "status", header: "Status", cell: (n) => <StatusBadge status={n.status ?? "draft"} /> },
          {
            key: "published_at",
            header: "Tarix",
            cell: (n) => new Date(n.published_at).toLocaleDateString(),
          },
        ]}
      />
    </div>
  );
}
