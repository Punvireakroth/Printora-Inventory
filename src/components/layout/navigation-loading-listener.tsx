"use client";

import { useLoadingContext } from "@/components/layout/loading-provider";
import { usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

function isInternalAppHref (href: string): boolean {
  if (!href || href.startsWith("#")) {
    return false;
  }
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return false;
  }
  return href.startsWith("/");
}

export function NavigationLoadingListener () {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startNavigation, completeNavigation } = useLoadingContext();

  useEffect(() => {
    completeNavigation();
  }, [pathname, searchParams, completeNavigation]);

  useEffect(() => {
    function handleClick (event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || !isInternalAppHref(href)) {
        return;
      }

      const nextUrl = new URL(href, window.location.origin);
      if (
        nextUrl.pathname === window.location.pathname
        && nextUrl.search === window.location.search
      ) {
        return;
      }

      startNavigation();
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startNavigation]);

  return null;
}
