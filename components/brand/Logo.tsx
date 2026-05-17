import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

type Props = {
  variant?: "auto" | "light" | "dark";
  width?: number;
  height?: number;
};

const SRC_LIGHT = "/01_Logo/SVG/zolaq-logo-primary-light.svg";
const SRC_DARK = "/01_Logo/SVG/zolaq-logo-primary-dark.svg";

export function Logo({ variant = "auto", width = 104, height = 36 }: Props) {
  return (
    <Link
      href={ROUTES.home}
      className="inline-flex items-center"
      aria-label="Zolaq — ana səhifə"
    >
      {variant === "dark" ? (
        <Image src={SRC_DARK} alt="Zolaq" width={width} height={height} priority />
      ) : variant === "light" ? (
        <Image src={SRC_LIGHT} alt="Zolaq" width={width} height={height} priority />
      ) : (
        <>
          <Image
            src={SRC_LIGHT}
            alt="Zolaq"
            width={width}
            height={height}
            priority
            className="zlq-logo-on-light"
          />
          <Image
            src={SRC_DARK}
            alt=""
            aria-hidden
            width={width}
            height={height}
            className="zlq-logo-on-dark"
          />
        </>
      )}
    </Link>
  );
}
