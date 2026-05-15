"use client";

type Props = {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Xəta baş verdi",
  message,
  code,
  onRetry,
}: Props) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div
        role="alert"
        className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3"
      >
        <p className="font-medium text-danger">{title}</p>
        {message ? (
          <p className="mt-1 text-sm text-foreground">{message}</p>
        ) : null}
        {code ? (
          <p className="mt-1 font-mono text-xs text-foreground-muted">
            {code}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated"
        >
          Yenidən cəhd et
        </button>
      ) : null}
    </div>
  );
}
