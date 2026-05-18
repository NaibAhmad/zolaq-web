import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { listEncyclopedia } from "@/lib/content/admin-store";
import { getLocalizedText } from "@/lib/i18n/localized";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminEncyclopediaPage() {
  const items = listEncyclopedia();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminContent.encyclopediaTitle")}</h1>
      <form
        action="/api/internal/content/encyclopedia"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <Input name="title" label={t("adminContent.newsTitleField")} required />
        <Input name="slug" label={t("adminContent.slug")} required />
        <div className="md:col-span-2">
          <Button type="submit">{t("adminContent.createDraft")}</Button>
        </div>
      </form>
      <AdminTable
        rows={items}
        rowKey={(e) => e.content_id}
        empty={t("adminContent.emptyEncyclopedia")}
        columns={[
          {
            key: "title",
            header: t("adminContent.newsTitleField"),
            cell: (e) => (
              <Link href={`/admin/content/encyclopedia/${e.content_id}`} className="font-medium hover:underline">
                {getLocalizedText(e.title, "az")}
              </Link>
            ),
          },
          { key: "slug", header: t("adminContent.slug"), cell: (e) => <code className="text-xs">{e.slug}</code> },
          { key: "category", header: t("adminContent.category"), cell: (e) => e.category ?? "—" },
          { key: "status", header: t("adminContent.statusCol"), cell: (e) => <StatusBadge status={e.status ?? "draft"} /> },
        ]}
      />
    </div>
  );
}
