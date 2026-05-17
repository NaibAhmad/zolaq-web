import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "orange"
  | "blue"
  | "muted"
  | "on-dark";

export type BadgeSize = "sm" | "md";

const TONE: Record<BadgeTone, string> = {
  neutral: "border border-border bg-surface text-foreground",
  brand: "border border-brand/15 bg-brand/10 text-brand",
  success: "border border-success/30 bg-success/10 text-success",
  warning: "border border-warning/30 bg-warning/10 text-warning",
  danger: "border border-danger/30 bg-danger/10 text-danger",
  orange:
    "border border-accent-orange/30 bg-accent-orange-soft text-accent-orange",
  blue: "border border-accent-blue/25 bg-accent-blue-soft text-accent-blue",
  muted: "border border-border bg-surface-muted text-foreground-muted",
  "on-dark":
    "border border-border-on-dark bg-white/5 text-on-dark",
};

const SIZE: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

type Props = {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
};

export function Badge({
  children,
  tone = "neutral",
  size = "sm",
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${TONE[tone]} ${SIZE[size]} ${className}`}
    >
      {children}
    </span>
  );
}
