type Props = {
  title: string;
  note?: string;
};

export function Placeholder({ title, note }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-foreground-muted">
        Sprint 1 placeholder. Real məzmun növbəti sprintlərdə əlavə olunacaq.
      </p>
      {note ? (
        <p className="mt-4 text-sm text-foreground-muted">{note}</p>
      ) : null}
    </div>
  );
}
