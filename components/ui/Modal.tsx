"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useT } from "@/lib/i18n/client";

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  darkHeader?: boolean;
  dismissible?: boolean;
  size?: "sm" | "md" | "lg";
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  darkHeader = true,
  dismissible = true,
  size = "md",
}: Props) {
  const t = useT();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !dismissible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  const headerClass = darkHeader
    ? "zlq-hero-dark flex items-start justify-between gap-4 px-6 py-4"
    : "border-b border-border bg-surface flex items-start justify-between gap-4 px-6 py-4";
  const eyebrowClass = darkHeader
    ? "text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue"
    : "text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange";
  const titleClass = darkHeader
    ? "mt-1 text-lg font-semibold text-on-dark"
    : "mt-1 text-lg font-semibold text-foreground";
  const closeBtnClass = darkHeader
    ? "rounded-full p-1 text-on-dark-muted hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
    : "rounded-full p-1 text-foreground-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full ${SIZE[size]} overflow-hidden rounded-[var(--radius-xl)] bg-surface text-foreground shadow-[var(--shadow-hero)]`}
      >
        <div className={headerClass}>
          <div>
            {eyebrow ? <p className={eyebrowClass}>{eyebrow}</p> : null}
            <h2 id={titleId} className={titleClass}>
              {title}
            </h2>
          </div>
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              className={closeBtnClass}
              aria-label={t("common.close")}
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="p-6">{children}</div>

        {footer ? (
          <div className="border-t border-border bg-surface px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
