import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  default: "max-w-7xl",
  narrow: "max-w-3xl",
  wide: "max-w-[88rem]",
};

export function Container({ children, className = "", size = "default" }: Props) {
  return (
    <div className={`mx-auto w-full ${SIZE[size]} px-4 md:px-6 ${className}`}>
      {children}
    </div>
  );
}
