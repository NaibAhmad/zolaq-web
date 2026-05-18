import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { listQA } from "@/lib/content/admin-store";
import { getLocalizedText } from "@/lib/i18n/localized";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminQAPage() {
  const items = listQA();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminContent.qaTitle")}</h1>
      <form
        action="/api/internal/content/qa"
        method="post"
        className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
      >
        <Input name="question" label={t("adminContent.question")} required />
        <Textarea name="answer" label={t("adminContent.answerLabel")} required />
        <div>
          <Button type="submit">{t("adminContent.createDraft")}</Button>
        </div>
      </form>
      <AdminTable
        rows={items}
        rowKey={(q) => q.content_id}
        empty={t("adminContent.emptyQa")}
        columns={[
          {
            key: "question",
            header: t("adminContent.question"),
            cell: (q) => (
              <Link href={`/admin/content/qa/${q.content_id}`} className="font-medium hover:underline">
                {getLocalizedText(q.question, "az")}
              </Link>
            ),
          },
          { key: "status", header: t("adminContent.statusCol"), cell: (q) => <StatusBadge status={q.status ?? "draft"} /> },
        ]}
      />
    </div>
  );
}
