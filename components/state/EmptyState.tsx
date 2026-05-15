import type { ReactNode } from "react";

type Props = {
  title: string;
  note?: string;
  action?: ReactNode;
};

export function EmptyState({ title, note, action }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {note ? (
        <p className="mt-2 text-sm text-foreground-muted">{note}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
