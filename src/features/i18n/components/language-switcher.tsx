"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALE_COOKIE_NAME } from "@/i18n/constants";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/types";
import { updatePreferredLocale } from "@/features/i18n/actions/update-preferred-locale";
import { useLoadingAction, useNavigationLoading } from "@/hooks/use-loading-action";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

function setLocaleCookie (locale: AppLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function LanguageSwitcher () {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const startNavigation = useNavigationLoading();
  const t = useTranslations("language");

  const localeItems = useMemo(
    () =>
      Object.fromEntries(
        routing.locales.map((code) => [code, t(`locale.${code}`)]),
      ),
    [t],
  );

  function switchTo (nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    const query = window.location.search.replace(/^\?/, "");
    const href = query ? `${pathname}?${query}` : pathname;

    void run(async () => {
      const result = await updatePreferredLocale(nextLocale);
      if (!result.ok) {
        return;
      }
      setLocaleCookie(nextLocale);
      startNavigation();
      router.replace(href, { locale: nextLocale });
    });
  }

  return (
    <Select
      disabled={isLoading}
      items={localeItems}
      onValueChange={(value) => {
        if (value) {
          switchTo(value as AppLocale);
        }
      }}
      value={locale}
    >
      <SelectTrigger
        aria-label={t("ariaLabel")}
        className="min-w-[7.5rem] bg-background"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {routing.locales.map((code) => (
          <SelectItem key={code} value={code}>
            {t(`locale.${code}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
