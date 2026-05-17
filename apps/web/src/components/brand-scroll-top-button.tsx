"use client";

import Image from "next/image";

import { scrollToLandingTop } from "@/lib/landing-scroll";
import { cn } from "@/lib/utils";

type BrandScrollTopButtonProps = {
  brand: string;
  brandClassName: string;
  className: string;
  logoClassName: string;
  logoPriority?: boolean;
  logoSrc: string;
  scrollToTopLabel: string;
};

export function BrandScrollTopButton({
  brand,
  brandClassName,
  className,
  logoClassName,
  logoPriority = false,
  logoSrc,
  scrollToTopLabel,
}: BrandScrollTopButtonProps) {
  return (
    <button
      type="button"
      className={cn("appearance-none border-0 bg-transparent p-0", className)}
      aria-label={scrollToTopLabel}
      onClick={() => scrollToLandingTop()}
    >
      <Image src={logoSrc} alt="" width={44} height={51} priority={logoPriority} className={logoClassName} />
      <span className={brandClassName}>{brand}</span>
    </button>
  );
}
