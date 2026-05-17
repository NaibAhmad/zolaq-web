// Standard admin/dealer form shell — title, optional description, slot for
// fields, slot for footer actions. Used by every create/edit form in the
// private panels.

import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  action: string; // form action url
  method?: "post" | "get";
  encType?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AdminFormShell({
  title,
  description,
  action,
  method = "post",
  encType,
  children,
  footer,
}: Props) {
  return (
    <form
      action={action}
      method={method}
      {...(encType ? { encType } : {})}
      className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="text-sm text-foreground-muted">{description}</p>
        ) : null}
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {footer}
      </footer>
    </form>
  );
}
