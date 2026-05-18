"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

type Props = {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title,
  message,
  code,
  onRetry,
}: Props) {
  const t = useT();
  const heading = title ?? t("status.error");
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div
        role="alert"
        className="flex gap-4 rounded-[var(--radius-lg)] border border-danger/30 bg-danger/5 p-5"
      >
        <span
          aria-hidden
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15 text-lg text-danger"
        >
          !
        </span>
        <div className="flex-1">
          <p className="font-semibold text-danger">{heading}</p>
          {message ? (
            <p className="mt-1 text-sm text-foreground">{message}</p>
          ) : null}
          {code ? (
            <p className="mt-2 font-mono text-xs text-foreground-muted">
              {code}
            </p>
          ) : null}
          {onRetry ? (
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={onRetry}>
                {t("errors.retry")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
