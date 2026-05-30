"use client";

import type { OwnerSaleListItem } from "@/features/sales/types/sale-list-item";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingLink } from "@/components/layout/loading-link";
import { MySalesFilters } from "@/features/sales/components/my-sales-filters";
import { cn, formatCurrency } from "@/lib/utils";
import { Eye } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Suspense } from "react";

type SalesListPanelProps = {
  sales: OwnerSaleListItem[];
};

function SaleStatusBadge ({ status }: { status: OwnerSaleListItem["status"] }) {
  const t = useTranslations("sales");

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-sm font-medium",
        status === "COMPLETED" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        status === "CANCELLED" && "bg-muted text-muted-foreground",
        status === "REFUNDED" && "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}

export function SalesListPanel ({ sales }: SalesListPanelProps) {
  const t = useTranslations("sales");
  const tPos = useTranslations("pos.payment");
  const format = useFormatter();

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-base text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        }
      >
        <MySalesFilters namespace="sales" />
      </Suspense>

      <div className="rounded-xl border border-border bg-card">
        {sales.length === 0 ? (
          <p className="p-8 text-center text-base text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <Table containerClassName="overflow-x-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px] px-4 py-3">
                  {t("columns.receiptNumber")}
                </TableHead>
                <TableHead className="min-w-[140px] px-4 py-3">
                  {t("columns.date")}
                </TableHead>
                <TableHead className="min-w-[120px] px-4 py-3">
                  {t("columns.cashier")}
                </TableHead>
                <TableHead className="min-w-[100px] px-4 py-3 text-right">
                  {t("columns.total")}
                </TableHead>
                <TableHead className="min-w-[120px] px-4 py-3">
                  {t("columns.paymentMethod")}
                </TableHead>
                <TableHead className="min-w-[100px] px-4 py-3">
                  {t("columns.status")}
                </TableHead>
                <TableHead className="min-w-[100px] px-4 py-3 text-right">
                  {t("columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="px-4 py-3 font-medium tabular-nums">
                    {sale.receiptNumber}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums whitespace-nowrap">
                    {format.dateTime(new Date(sale.completedAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-normal">
                    {sale.cashierName}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(sale.total)}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    {tPos(sale.paymentMethod)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <SaleStatusBadge status={sale.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <LoadingLink
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      href={`/pos/receipt/${sale.id}`}
                    >
                      <Eye aria-hidden className="size-4" />
                      {t("viewReceipt")}
                    </LoadingLink>
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
