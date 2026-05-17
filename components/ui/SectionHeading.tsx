import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  action?: { label: string; href: string } | null;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  tone = "light",
  action,
  className = "",
}: Props) {
  const eyebrowClass =
    tone === "dark"
      ? "text-accent-blue"
      : "text-accent-orange";
  const titleClass =
    tone === "dark" ? "text-on-dark" : "text-foreground";
  const subtitleClass =
    tone === "dark" ? "text-on-dark-muted" : "text-foreground-muted";
  const wrapperAlign = align === "center" ? "items-center text-center" : "";

  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div className={`flex flex-col gap-2 ${wrapperAlign}`}>
        {eyebrow ? (
          <span
            className={`text-xs font-semibold uppercase tracking-[0.18em] ${eyebrowClass}`}
          >
            {eyebrow}
          </span>
        ) : null}
        <h2 className={`text-2xl font-semibold md:text-3xl ${titleClass}`}>
          {title}
        </h2>
        {subtitle ? (
          <p className={`max-w-2xl text-sm md:text-base ${subtitleClass}`}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className={`inline-flex items-center gap-1 text-sm font-medium ${
            tone === "dark"
              ? "text-accent-blue hover:text-on-dark"
              : "text-accent-blue hover:underline"
          }`}
        >
          {action.label}
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}
