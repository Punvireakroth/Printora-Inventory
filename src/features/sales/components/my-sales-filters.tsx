"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}: {
  namespace?: "pos.history" | "sales";
}) {
  const t = useTranslations(namespace);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startNavigation = useNavigationLoading();
  const { navigationPending } = useLoadingContext();
  const [pending, startTransition] = useTransition();
  const isFilterPending = pending || navigationPending;

  const period = (searchParams.get("period") ?? "") as PeriodValue;
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";

  function pushFilters (next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    if ("period" in next && next.period) {
      params.delete("from");
      params.delete("to");
    }

    if ("from" in next || "to" in next) {
      params.delete("period");
    }

    startTransition(() => {
      startNavigation();
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="flex flex-col gap-4">
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
              pushFilters({ period: value });
            }}
            type="button"
          >
            {value === ""
              ? t("filters.all")
              : t(`filters.period.${value}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <div className="space-y-2">
          <Label htmlFor="sales-from">{t("filters.dateFrom")}</Label>
          <Input
            disabled={isFilterPending}
            id="sales-from"
            onChange={(event) => {
              pushFilters({ from: event.target.value });
            }}
            type="date"
            value={dateFrom}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sales-to">{t("filters.dateTo")}</Label>
          <Input
            disabled={isFilterPending}
            id="sales-to"
            onChange={(event) => {
              pushFilters({ to: event.target.value });
            }}
            type="date"
            value={dateTo}
          />
        </div>
      </div>
    </div>
  );
}
