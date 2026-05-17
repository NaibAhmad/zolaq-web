import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { listQA } from "@/lib/content/admin-store";

export default function AdminQAPage() {
  const items = listQA();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Sual-cavab</h1>
      <form
        action="/api/internal/content/qa"
        method="post"
        className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
      >
        <Input name="question" label="Sual" required />
        <Textarea name="answer" label="Cavab" required />
        <div>
          <Button type="submit">Qaralama yarat</Button>
        </div>
      </form>
      <AdminTable
        rows={items}
        rowKey={(q) => q.content_id}
        empty="Sual yoxdur."
        columns={[
          {
            key: "question",
            header: "Sual",
            cell: (q) => (
              <Link href={`/admin/content/qa/${q.content_id}`} className="font-medium hover:underline">
                {q.question}
              </Link>
            ),
          },
          { key: "status", header: "Status", cell: (q) => <StatusBadge status={q.status ?? "draft"} /> },
        ]}
      />
    </div>
  );
}
