import { Card } from "@/components/ui/Card";

type Item = {
  label: string;
  value: string;
  hint: string;
  glyph: string;
};

const ITEMS: ReadonlyArray<Item> = [
  {
    label: "Rəsmi diler",
    value: "100%",
    hint: "Yalnız rəsmi və təsdiqlənmiş tərəfdaşlar",
    glyph: "◇",
  },
  {
    label: "PDF-li təklif",
    value: "İmzalı",
    hint: "Rəsmi qiymət sənədini endir və saxla",
    glyph: "✓",
  },
  {
    label: "Gündəlik qiymət",
    value: "24 saat",
    hint: "Mənbə və yoxlama statusu açıq",
    glyph: "⟳",
  },
  {
    label: "Müqayisə",
    value: "2-3 maşın",
    hint: "Texniki və qiymət göstəriciləri",
    glyph: "⇄",
  },
];

export function HomeTrustStrip() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((it) => (
        <li key={it.label}>
          <Card
            padding="md"
            tone="raised"
            interactive
            className="h-full"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent-blue-soft text-lg text-accent-blue"
              >
                {it.glyph}
              </span>
              <div className="flex flex-col">
                <p className="text-xs uppercase tracking-wide text-foreground-muted">
                  {it.label}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">
                  {it.value}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">{it.hint}</p>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
