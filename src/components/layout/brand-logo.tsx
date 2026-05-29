import Image from "next/image";

import { BRAND_LOGO_ASPECT, BRAND_LOGO_PATH } from "@/constants/brand";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const LogoHeight = {
  sm: 28,
  md: 32,
  lg: 40,
} as const;

type BrandLogoProps = {
  alt: string;
  className?: string;
  href?: string;
  linkClassName?: string;
  priority?: boolean;
  size?: keyof typeof LogoHeight;
};

export function BrandLogo ({
  alt,
  className,
  href,
  linkClassName,
  priority,
  size = "md",
}: BrandLogoProps) {
  const Height = LogoHeight[size];
  const Width = Math.round(Height * BRAND_LOGO_ASPECT);

  const image = (
    <Image
      alt={alt}
      className={cn("h-auto max-w-full object-contain object-left", className)}
      height={Height}
      priority={priority}
      src={BRAND_LOGO_PATH}
      width={Width}
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link
      className={cn(
        "inline-flex shrink-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
        linkClassName,
      )}
      href={href}
    >
      {image}
    </Link>
  );
}
