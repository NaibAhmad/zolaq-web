// Minimal table primitive for admin/dealer dashboards. Reusable across
// brands/models/trims/prices/dealers/offers/submissions/content tables.

import type { ReactNode } from "react";

export type AdminTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  caption?: ReactNode;
};

export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
}: Props<T>) {
  if (rows.length === 0 && empty) {
    return <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-sm text-foreground-muted">{empty}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
      <table className="w-full min-w-[640px] text-left text-sm">
        {caption ? (
          <caption className="border-b border-border bg-surface-muted px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {caption}
          </caption>
        ) : null}
        <thead className="border-b border-border bg-surface-muted text-xs font-medium uppercase tracking-wide text-foreground-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-2 ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border last:border-b-0 hover:bg-surface-muted/40"
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 align-top ${c.className ?? ""}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
