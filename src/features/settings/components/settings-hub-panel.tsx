"use client";

import { LoadingLink } from "@/components/layout/loading-link";
import { ChevronRight, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export function SettingsHubPanel () {
  const t = useTranslations("settingsHub");

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        <li>
          <LoadingLink
            className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
            href="/settings/users"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users aria-hidden className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{t("staffLink")}</span>
              <span className="block text-sm text-muted-foreground">
                {t("staffLinkDescription")}
              </span>
            </span>
            <ChevronRight
              aria-hidden
              className="size-5 shrink-0 text-muted-foreground"
            />
          </LoadingLink>
        </li>
      </ul>
    </div>
  );
}
