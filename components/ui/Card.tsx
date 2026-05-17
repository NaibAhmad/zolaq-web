import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  tone?: "light" | "dark" | "muted" | "raised";
  interactive?: boolean;
  as?: "div" | "article" | "section" | "li" | "ul" | "ol";
};

const PADDING: Record<NonNullable<Props["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  light:
    "border border-border bg-surface text-foreground",
  raised:
    "border border-border bg-surface text-foreground shadow-[var(--shadow-card)]",
  muted:
    "border border-border bg-surface-muted text-foreground",
  dark:
    "border border-border-on-dark bg-surface-dark-elevated text-on-dark",
};

export function Card({
  children,
  className = "",
  padding = "md",
  tone = "raised",
  interactive = false,
  as = "div",
}: Props) {
  const Tag = as;
  const hover = interactive
    ? "transition-shadow hover:shadow-[var(--shadow-card-hover)]"
    : "";
  return (
    <Tag
      className={`rounded-[var(--radius-lg)] ${TONE[tone]} ${PADDING[padding]} ${hover} ${className}`}
    >
      {children}
    </Tag>
  );
}
