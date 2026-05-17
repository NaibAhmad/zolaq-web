import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { listMediaAssets, type MediaStatus } from "@/lib/media/repository";

const STATUS_TONE: Record<MediaStatus, "muted" | "brand" | "blue" | "danger" | "neutral"> = {
  uploaded: "blue",
  processing: "muted",
  active: "brand",
  rejected: "danger",
  archived: "neutral",
};

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ owner_type?: string; owner_id?: string; status?: string }>;
}) {
  const params = await searchParams;
  const filter = {
    ...(params.owner_type && { owner_type: params.owner_type }),
    ...(params.owner_id && { owner_id: params.owner_id }),
    ...(params.status && { status: params.status as MediaStatus }),
  };
  const assets = await listMediaAssets(filter);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Media</h1>
      <p className="text-sm text-foreground-muted">
        Diler yüklədiyi şəkillər “uploaded” statusunda gəlir; aktivləşmək üçün
        təsdiq tələb edir. Admin yükləməsi avtomatik “active”dir.
      </p>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Şəkil yüklə</h2>
        <form
          action="/api/admin/media/upload"
          method="post"
          encType="multipart/form-data"
          className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <Input
            name="owner_type"
            label="Owner tipi"
            placeholder="trim / dealer / news / general"
            defaultValue={params.owner_type ?? "general"}
          />
          <Input
            name="owner_id"
            label="Owner ID (opsional)"
            defaultValue={params.owner_id ?? ""}
          />
          <Input name="alt_text" label="Alt mətn" />
          <div className="flex items-end">
            <Button type="submit">Yüklə</Button>
          </div>
          <div className="md:col-span-3">
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="block w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </form>
      </Card>

      <form className="flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-3">
        <Input name="owner_type" label="Owner tipi filtri" defaultValue={params.owner_type ?? ""} />
        <Input name="owner_id" label="Owner ID filtri" defaultValue={params.owner_id ?? ""} />
        <Select
          name="status"
          label="Status filtri"
          defaultValue={params.status ?? ""}
          placeholderOption="Hamısı"
          options={[
            { value: "uploaded", label: "Yüklənib" },
            { value: "active", label: "Aktiv" },
            { value: "rejected", label: "Rədd edilib" },
            { value: "archived", label: "Arxivdə" },
          ]}
        />
        <Button type="submit" variant="secondary">Filtrlə</Button>
      </form>

      <Card padding="md">
        {assets.length === 0 ? (
          <p className="text-sm text-foreground-muted">Heç bir media tapılmadı.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-surface-muted/40 p-3"
              >
                <div className="aspect-video overflow-hidden rounded-[var(--radius)] bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.public_url} alt={m.alt_text ?? ""} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <Badge tone={STATUS_TONE[m.status] ?? "muted"}>{m.status}</Badge>
                    <code className="text-foreground-muted">
                      {m.owner_type}
                      {m.owner_id ? `:${m.owner_id}` : ""}
                    </code>
                  </div>
                  <div className="break-all text-foreground-muted">{m.public_url}</div>
                  <div className="text-foreground-muted">
                    {m.original_file_name} · {Math.round(m.size_bytes / 1024)} KB ·{" "}
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={`/api/internal/media/${m.id}`} method="post">
                    <input type="hidden" name="_method" value="patch" />
                    <input type="hidden" name="status" value="active" />
                    <Button type="submit" size="sm" disabled={m.status === "active"}>
                      Təsdiq
                    </Button>
                  </form>
                  <form action={`/api/internal/media/${m.id}`} method="post">
                    <input type="hidden" name="_method" value="patch" />
                    <input type="hidden" name="status" value="rejected" />
                    <Button type="submit" size="sm" variant="danger" disabled={m.status === "rejected"}>
                      Rədd et
                    </Button>
                  </form>
                  <form action={`/api/internal/media/${m.id}`} method="post">
                    <input type="hidden" name="_method" value="patch" />
                    <input type="hidden" name="status" value="archived" />
                    <Button type="submit" size="sm" variant="ghost" disabled={m.status === "archived"}>
                      Arxivlə
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
