import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

type Props = {
  variant?: "dark" | "light";
  width?: number;
  height?: number;
};

export function Logo({ variant = "dark", width = 108, height = 28 }: Props) {
  const src =
    variant === "dark"
      ? "/01_Logo/SVG/zolaq-logo-primary-dark.svg"
      : "/01_Logo/SVG/zolaq-logo-primary-light.svg";

  return (
    <Link
      href={ROUTES.home}
      className="inline-flex items-center"
      aria-label="Zolaq — ana səhifə"
    >
      <Image src={src} alt="Zolaq" width={width} height={height} priority />
    </Link>
  );
}
