"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLoadingContext } from "@/components/layout/loading-provider";
import { useNavigationLoading } from "@/hooks/use-loading-action";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

const PERIODS = ["", "today", "week", "month"] as const;

type PeriodValue = (typeof PERIODS)[number];

export function MySalesFilters ({
  namespace = "pos.history",
  activePeriod,
}: {
  namespace?: "pos.history" | "sales" | "reports";
  activePeriod?: "today" | "week" | "month" | "";
}) {
  const t = useTranslations(namespace);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startNavigation = useNavigationLoading();
  const { navigationPending } = useLoadingContext();
  const [pending, startTransition] = useTransition();
  const isFilterPending = pending || navigationPending;

  const period = (searchParams.get("period") ?? activePeriod ?? "") as PeriodValue;

  function pushPeriod (value: PeriodValue) {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("from");
    params.delete("to");

    if (!value) {
      params.delete("period");
    } else {
      params.set("period", value);
    }

    startTransition(() => {
      startNavigation();
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((value) => (
        <button
          className={cn(
            "inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
            period === value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted/50",
          )}
          disabled={isFilterPending}
          key={value || "all"}
          onClick={() => {
            pushPeriod(value);
          }}
          type="button"
        >
          {value === ""
            ? t("filters.all")
            : t(`filters.period.${value}`)}
        </button>
      ))}
    </div>
  );
}
