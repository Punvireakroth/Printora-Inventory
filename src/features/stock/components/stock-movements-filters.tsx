"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { StockMovementType } from "@/features/stock/types/stock-movement";
import { FieldSelect } from "@/components/ui/field-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoadingContext } from "@/components/layout/loading-provider";
import { useNavigationLoading } from "@/hooks/use-loading-action";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useTransition } from "react";

const MOVEMENT_TYPES: (StockMovementType | "ALL")[] = [
  "ALL",
  "STOCK_IN",
  "SALE",
  "ADJUSTMENT",
  "REFUND",
];

export function StockMovementsFilters () {
  const t = useTranslations("stock.movements");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startNavigation = useNavigationLoading();
  const { navigationPending } = useLoadingContext();
  const [pending, startTransition] = useTransition();
  const isFilterPending = pending || navigationPending;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = searchParams.get("q") ?? "";
  const movementType = searchParams.get("type") ?? "ALL";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";

  const typeOptions = useMemo(
    () =>
      MOVEMENT_TYPES.map((value) => ({
        value,
        label: value === "ALL" ? t("filters.allTypes") : t(`type.${value}`),
      })),
    [t],
  );

  function pushFilters (next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      startNavigation();
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-2 sm:col-span-2 lg:col-span-2">
        <Label htmlFor="movements-search">{t("filters.search")}</Label>
        <Input
          defaultValue={query}
          disabled={isFilterPending}
          id="movements-search"
          onChange={(event) => {
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
              pushFilters({ q: event.target.value });
            }, 300);
          }}
          placeholder={t("filters.searchPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="movements-type">{t("filters.type")}</Label>
        <FieldSelect
          disabled={isFilterPending}
          id="movements-type"
          onValueChange={(value) => {
            pushFilters({ type: value });
          }}
          options={typeOptions}
          placeholder={t("filters.allTypes")}
          value={movementType}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="movements-from">{t("filters.dateFrom")}</Label>
        <Input
          disabled={isFilterPending}
          id="movements-from"
          onChange={(event) => {
            pushFilters({ from: event.target.value });
          }}
          type="date"
          value={dateFrom}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="movements-to">{t("filters.dateTo")}</Label>
        <Input
          disabled={isFilterPending}
          id="movements-to"
          onChange={(event) => {
            pushFilters({ to: event.target.value });
          }}
          type="date"
          value={dateTo}
        />
      </div>
    </div>
  );
}
