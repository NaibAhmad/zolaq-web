import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { listEncyclopedia } from "@/lib/content/admin-store";

export default function AdminEncyclopediaPage() {
  const items = listEncyclopedia();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Ensiklopediya</h1>
      <form
        action="/api/internal/content/encyclopedia"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <Input name="title" label="Başlıq" required />
        <Input name="slug" label="Slug" required />
        <div className="md:col-span-2">
          <Button type="submit">Qaralama yarat</Button>
        </div>
      </form>
      <AdminTable
        rows={items}
        rowKey={(e) => e.content_id}
        empty="Yazı yoxdur."
        columns={[
          {
            key: "title",
            header: "Başlıq",
            cell: (e) => (
              <Link href={`/admin/content/encyclopedia/${e.content_id}`} className="font-medium hover:underline">
                {e.title}
              </Link>
            ),
          },
          { key: "slug", header: "Slug", cell: (e) => <code className="text-xs">{e.slug}</code> },
          { key: "category", header: "Kateqoriya", cell: (e) => e.category ?? "—" },
          { key: "status", header: "Status", cell: (e) => <StatusBadge status={e.status ?? "draft"} /> },
        ]}
      />
    </div>
  );
}
