"use client";

import { LoadingLink } from "@/components/layout/loading-link";
import { ChevronRight, FolderTree, Truck, Users } from "lucide-react";
import { useTranslations } from "next-intl";

const HUB_LINKS = [
  {
    href: "/settings/users",
    icon: Users,
    titleKey: "staffLink",
    descriptionKey: "staffLinkDescription",
  },
  {
    href: "/categories",
    icon: FolderTree,
    titleKey: "categoriesLink",
    descriptionKey: "categoriesLinkDescription",
  },
  {
    href: "/suppliers",
    icon: Truck,
    titleKey: "suppliersLink",
    descriptionKey: "suppliersLinkDescription",
  },
] as const;

export function SettingsHubPanel () {
  const t = useTranslations("settingsHub");

  return (
    <section className="flex w-full flex-col gap-3">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {t("manageTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("manageSubtitle")}</p>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {HUB_LINKS.map(
          ({ href, icon: Icon, titleKey, descriptionKey }) => (
            <li key={href}>
              <LoadingLink
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
                href={href}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t(titleKey)}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t(descriptionKey)}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden
                  className="size-5 shrink-0 text-muted-foreground"
                />
              </LoadingLink>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
