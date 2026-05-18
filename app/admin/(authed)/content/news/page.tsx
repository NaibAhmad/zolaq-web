import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { listNews } from "@/lib/content/admin-store";
import { formatDateAz } from "@/lib/format/date";
import { getLocalizedText } from "@/lib/i18n/localized";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminNewsPage() {
  const items = listNews();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminContent.newsTitle")}</h1>
      <form
        action="/api/internal/content/news"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <Input name="title" label={t("adminContent.newsTitleField")} required />
        <Input
          name="slug"
          label={t("adminContent.slug")}
          required
          placeholder={t("adminContent.slugHint")}
        />
        <div className="md:col-span-2">
          <Button type="submit">{t("adminContent.createDraft")}</Button>
        </div>
      </form>
      <AdminTable
        rows={items}
        rowKey={(n) => n.content_id}
        empty={t("adminContent.emptyNews")}
        columns={[
          {
            key: "title",
            header: t("adminContent.newsTitleField"),
            cell: (n) => (
              <Link href={`/admin/content/news/${n.content_id}`} className="font-medium hover:underline">
                {getLocalizedText(n.title, "az")}
              </Link>
            ),
          },
          { key: "slug", header: t("adminContent.slug"), cell: (n) => <code className="text-xs">{n.slug}</code> },
          { key: "category", header: t("adminContent.category"), cell: (n) => n.category ?? "—" },
          { key: "status", header: t("adminContent.statusCol"), cell: (n) => <StatusBadge status={n.status ?? "draft"} /> },
          {
            key: "published_at",
            header: t("adminContent.date"),
            cell: (n) => formatDateAz(n.published_at),
          },
        ]}
      />
    </div>
  );
}
