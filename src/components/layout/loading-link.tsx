"use client";

import { useLoadingContext } from "@/components/layout/loading-provider";
import { useNavigationLoading } from "@/hooks/use-loading-action";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type LoadingLinkProps = ComponentProps<typeof Link>;

function isSameAppLocation (href: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const nextUrl = new URL(href, window.location.origin);
  return (
    nextUrl.pathname === window.location.pathname
    && nextUrl.search === window.location.search
  );
}

export function LoadingLink ({
  className,
  onClick,
  ...props
}: LoadingLinkProps) {
  const startNavigation = useNavigationLoading();
  const { navigationPending } = useLoadingContext();

  return (
    <Link
      {...props}
      aria-busy={navigationPending || undefined}
      className={cn(
        navigationPending && "pointer-events-none opacity-70",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }

        const href = typeof props.href === "string" ? props.href : null;
        if (href && isSameAppLocation(href)) {
          return;
        }

        startNavigation();
      }}
    />
  );
}
