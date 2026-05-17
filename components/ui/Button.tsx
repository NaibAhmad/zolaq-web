import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "whatsapp"
  | "dark"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-orange text-accent-orange-fg shadow-sm hover:brightness-110 active:brightness-95",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-muted",
  ghost: "text-foreground hover:bg-surface-muted",
  whatsapp:
    "bg-accent-green text-accent-green-fg shadow-sm hover:brightness-110 active:brightness-95",
  dark: "bg-brand text-brand-fg shadow-sm hover:brightness-125 active:brightness-110",
  danger:
    "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60";

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type LinkProps = SharedProps & {
  href: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
};

type NativeButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

function buildClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className: string,
): string {
  return `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${
    fullWidth ? "w-full" : ""
  } ${className}`.trim();
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  target,
  rel,
  ariaLabel,
}: LinkProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      className={buildClasses(variant, size, fullWidth, className)}
    >
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  type = "button",
  ...rest
}: NativeButtonProps) {
  return (
    <button
      type={type}
      className={buildClasses(variant, size, fullWidth, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
