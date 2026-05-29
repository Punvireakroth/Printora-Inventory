"use client";

import { useLoadingContext } from "@/components/layout/loading-provider";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";

export function LoadingIndicator () {
  const t = useTranslations("common");
  const { actionPending, navigationPending } = useLoadingContext();

  return (
    <>
      {navigationPending ? (
        <div
          aria-hidden
          className="pointer-events-none fixed top-0 z-[100] h-0.5 overflow-hidden"
        >
          <div className="h-full w-1/3 animate-loading-bar bg-primary" />
        </div>
      ) : null}

      {actionPending ? (
        <div
          aria-busy="true"
          aria-live="polite"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/45 backdrop-blur-[1px]"
        >
          <div className="flex flex-col items-center gap-3 px-6 py-5">
            <Spinner label={t("loading")} size="lg" />
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
