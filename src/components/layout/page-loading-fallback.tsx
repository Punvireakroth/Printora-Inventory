"use client";

import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";

export function PageLoadingFallback () {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-12">
      <Spinner label={t("loading")} size="lg" />
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  );
}
