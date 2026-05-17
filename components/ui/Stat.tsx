import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
};

export function Stat({
  label,
  value,
  hint,
  tone = "light",
  align = "left",
  className = "",
}: Props) {
  const valueClass =
    tone === "dark" ? "text-on-dark" : "text-foreground";
  const labelClass =
    tone === "dark" ? "text-on-dark-muted" : "text-foreground-muted";
  return (
    <div
      className={`flex flex-col gap-1 ${
        align === "center" ? "items-center text-center" : ""
      } ${className}`}
    >
      <p className={`text-xs uppercase tracking-wide ${labelClass}`}>{label}</p>
      <p className={`text-2xl font-semibold leading-tight ${valueClass}`}>
        {value}
      </p>
      {hint ? (
        <p className={`text-xs ${labelClass}`}>{hint}</p>
      ) : null}
    </div>
  );
}
