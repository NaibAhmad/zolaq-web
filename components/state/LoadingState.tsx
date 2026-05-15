type Props = {
  label?: string;
};

export function LoadingState({ label = "Yüklənir…" }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-3xl px-6 py-12 text-foreground-muted"
    >
      <span className="inline-block animate-pulse">{label}</span>
    </div>
  );
}
