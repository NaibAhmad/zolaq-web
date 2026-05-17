type Props = {
  label?: string;
};

export function LoadingState({ label = "Yüklənir…" }: Props) {
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
      <span>{label}</span>
    </div>
  );
}
