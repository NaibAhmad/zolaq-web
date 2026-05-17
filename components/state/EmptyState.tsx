import type { ReactNode } from "react";

type Props = {
  title: string;
  note?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, note, action, icon }: Props) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 py-16 text-center">
      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-xl text-foreground-muted"
      >
        {icon ?? "∅"}
      </span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {note ? (
        <p className="max-w-md text-sm text-foreground-muted">{note}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
