"use client";

import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE_NAME } from "@/i18n/constants";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/types";
import { updatePreferredLocale } from "@/features/i18n/actions/update-preferred-locale";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

function setLocaleCookie(locale: AppLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("language");

  function switchTo(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    // Read query in the handler only — avoids useSearchParams SSR/hydration mismatch.
    const query = window.location.search.replace(/^\?/, "");
    const href = query ? `${pathname}?${query}` : pathname;

    startTransition(async () => {
      const result = await updatePreferredLocale(nextLocale);
      if (!result.ok) {
        return;
      }
      setLocaleCookie(nextLocale);
      router.replace(href, { locale: nextLocale });
    });
  }

  return (
    <div
      aria-label={t("ariaLabel")}
      className="inline-flex gap-1 rounded-lg border border-border bg-muted/40 p-0.5"
      role="group"
    >
      {routing.locales.map((code) => {
        const isSelected = code === locale;
        return (
          <Button
            aria-pressed={isSelected}
            disabled={isPending}
            key={code}
            onClick={() => switchTo(code as AppLocale)}
            size="xs"
            type="button"
            variant={isSelected ? "secondary" : "ghost"}
          >
            {t(`locale.${code}`)}
          </Button>
        );
      })}
    </div>
  );
}
