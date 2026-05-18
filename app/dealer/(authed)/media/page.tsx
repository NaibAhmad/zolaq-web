import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { formatDateAz } from "@/lib/format/date";
import { listMediaAssets, type MediaStatus } from "@/lib/media/repository";

const STATUS_LABEL: Record<MediaStatus, string> = {
  uploaded: "Yoxlamada",
  processing: "İşlənir",
  active: "Aktiv",
  rejected: "Rədd edildi",
  archived: "Arxivdə",
};

const STATUS_TONE: Record<MediaStatus, "blue" | "muted" | "brand" | "danger" | "neutral"> = {
  uploaded: "blue",
  processing: "muted",
  active: "brand",
  rejected: "danger",
  archived: "neutral",
};

export default async function DealerMediaPage() {
  const session = await getDealerSession();
  const mine = session
    ? await listMediaAssets({ owner_type: "dealer", owner_id: session.dealerId })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Media</h1>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Fayl yüklə</h2>
        <p className="mb-3 text-sm text-foreground-muted">
          JPEG / PNG / WebP qəbul edilir. Yüklənmiş şəkillər admin tərəfindən
          təsdiq edildikdən sonra ictimai görünür.
        </p>
        <form
          action="/api/dealer/media/upload"
          method="post"
          encType="multipart/form-data"
          className="grid gap-3 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="block w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <Input name="alt_text" label="Alt mətn" />
          <Input name="caption" label="Şərh" />
          <div className="flex items-end md:col-span-2">
            <Button type="submit">Yüklə</Button>
          </div>
        </form>
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">URL göndər (köhnə üsul)</h2>
        <p className="mb-3 text-sm text-foreground-muted">
          Mövcud şəkil URL-ini admin yoxlaması üçün göndərə bilərsiniz.
        </p>
        <form
          action="/api/dealer/media"
          method="post"
          className="grid gap-3 md:grid-cols-2"
        >
          <Input name="image_url" label="Şəkil URL" required placeholder="https://..." />
          <Input name="image_alt" label="Alt mətn" />
          <Input name="caption" label="Şərh" />
          <div className="flex items-end md:col-span-2">
            <Button type="submit" variant="secondary">Yoxlamaya göndər</Button>
          </div>
        </form>
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Yüklənmiş şəkilləriniz</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-foreground-muted">Hələ heç bir şəkil yükləməmisiniz.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mine.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-surface-muted/40 p-3"
              >
                <div className="aspect-video overflow-hidden rounded-[var(--radius)] bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.public_url} alt={m.alt_text ?? ""} className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <Badge tone={STATUS_TONE[m.status] ?? "muted"}>{STATUS_LABEL[m.status]}</Badge>
                  <span className="text-foreground-muted">
                    {formatDateAz(m.created_at)}
                  </span>
                </div>
                <div className="break-all text-xs text-foreground-muted">{m.public_url}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
