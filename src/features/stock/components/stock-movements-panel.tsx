"use client";

import type { StockMovementListItem } from "@/features/stock/types/stock-movement";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingLink } from "@/components/layout/loading-link";
import { ListExportButton } from "@/components/layout/list-export-button";
import { StockMovementsFilters } from "@/features/stock/components/stock-movements-filters";
import { buildStockMovementsExportColumns } from "@/lib/export/list-export-columns";
import { cn } from "@/lib/utils";
import { History, Plus, SlidersHorizontal } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Suspense, useMemo } from "react";

type StockMovementsPanelProps = {
  movements: StockMovementListItem[];
};

function formatQuantityDelta (
  delta: number,
  formatNumber: (value: number) => string,
): string {
  if (delta > 0) {
    return `+${formatNumber(delta)}`;
  }
  return formatNumber(delta);
}

function MovementTypeBadge ({
  movementType,
}: {
  movementType: StockMovementListItem["movementType"];
}) {
  const t = useTranslations("stock.movements");

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-sm font-medium",
        movementType === "STOCK_IN" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        movementType === "SALE" && "bg-red-500/10 text-red-700 dark:text-red-400",
        movementType === "ADJUSTMENT" && "bg-amber-500/10 text-amber-800 dark:text-amber-400",
        movementType === "REFUND" && "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      )}
    >
      {t(`type.${movementType}`)}
    </span>
  );
}

export function StockMovementsPanel ({ movements }: StockMovementsPanelProps) {
  const t = useTranslations("stock.movements");
  const format = useFormatter();
  const exportColumns = useMemo(
    () => buildStockMovementsExportColumns(t, format),
    [t, format],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ListExportButton
            columns={exportColumns}
            filenameBase="stock-movements"
            rows={movements}
          />
          <LoadingLink
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-base font-medium hover:bg-muted/50"
            href="/stock/receives"
          >
            <History aria-hidden className="size-4" />
            {t("receiveHistory")}
          </LoadingLink>
          <LoadingLink
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-base font-medium hover:bg-muted/50"
            href="/stock/adjust"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            {t("adjustStock")}
          </LoadingLink>
          <LoadingLink
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-base font-medium text-primary-foreground hover:bg-primary/80"
            href="/stock/receive"
          >
            <Plus aria-hidden className="size-4" />
            {t("newReceive")}
          </LoadingLink>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        }
      >
        <StockMovementsFilters />
      </Suspense>

      <div className="rounded-xl border border-border bg-card">
        {movements.length === 0 ? (
          <p className="p-8 text-center text-base text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <Table containerClassName="overflow-x-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px] px-4 py-3">{t("columns.date")}</TableHead>
                <TableHead className="min-w-[180px] px-4 py-3">{t("columns.product")}</TableHead>
                <TableHead className="min-w-[120px] px-4 py-3">{t("columns.type")}</TableHead>
                <TableHead className="min-w-[80px] px-4 py-3 text-right">{t("columns.quantity")}</TableHead>
                <TableHead className="min-w-[80px] px-4 py-3 text-right">{t("columns.oldStock")}</TableHead>
                <TableHead className="min-w-[80px] px-4 py-3 text-right">{t("columns.newStock")}</TableHead>
                <TableHead className="min-w-[140px] px-4 py-3">{t("columns.user")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="px-4 py-3 tabular-nums whitespace-nowrap">
                    {format.dateTime(new Date(movement.createdAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-normal">
                    <div className="font-medium">{movement.productName}</div>
                    <div className="text-sm text-muted-foreground">{movement.productSku}</div>
                    {movement.notes ? (
                      <div className="mt-1 text-sm text-muted-foreground">{movement.notes}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <MovementTypeBadge movementType={movement.movementType} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-3 text-right tabular-nums font-medium",
                      movement.quantityDelta > 0 && "text-emerald-700 dark:text-emerald-400",
                      movement.quantityDelta < 0 && "text-red-700 dark:text-red-400",
                    )}
                  >
                    {formatQuantityDelta(movement.quantityDelta, (value) =>
                      format.number(value),
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {format.number(movement.oldStock)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {format.number(movement.newStock)}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-normal">
                    {movement.createdByName}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
