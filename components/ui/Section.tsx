import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark" | "muted";
  padding?: "sm" | "md" | "lg";
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  light: "bg-background text-foreground",
  dark: "zlq-hero-dark text-on-dark",
  muted: "bg-surface-muted text-foreground",
};

const PADDING: Record<NonNullable<Props["padding"]>, string> = {
  sm: "py-6 md:py-8",
  md: "py-10 md:py-14",
  lg: "py-14 md:py-20",
};

export function Section({
  children,
  className = "",
  tone = "light",
  padding = "md",
}: Props) {
  return (
    <section className={`relative ${TONE[tone]} ${PADDING[padding]} ${className}`}>
      {children}
    </section>
  );
}
