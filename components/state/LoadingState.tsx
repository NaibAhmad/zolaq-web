"use client";

import { useT } from "@/lib/i18n/client";

type Props = {
  label?: string;
};

export function LoadingState({ label }: Props) {
  const t = useT();
  const text = label ?? t("status.loading");
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-12 text-foreground-muted"
    >
      <span
        aria-hidden
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent-blue/30 border-t-accent-blue"
      />
      <span>{text}</span>
    </div>
  );
}
