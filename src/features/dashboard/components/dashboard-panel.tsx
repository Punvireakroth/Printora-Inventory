"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingLink } from "@/components/layout/loading-link";
import type {
  DashboardLowStockProduct,
  DashboardRecentSale,
  DashboardStats,
} from "@/features/dashboard/types/dashboard";
import type { StockMovementListItem } from "@/features/stock/types/stock-movement";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarRange,
  DollarSign,
  Package,
  Receipt,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type DashboardPanelProps = {
  stats: DashboardStats;
  recentSales: DashboardRecentSale[];
  recentMovements: StockMovementListItem[];
  lowStockProducts: DashboardLowStockProduct[];
};


const DASHBOARD_TABLE_ROW_LIMIT = 4;

function DashboardTablePreview ({
  totalCount,
  children,
}: {
  totalCount: number;
  children: ReactNode;
}) {
  const t = useTranslations("dashboard");
  const hasMore = totalCount > DASHBOARD_TABLE_ROW_LIMIT;

  return (
    <div className="relative">
      {children}
      {hasMore ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-card from-30% via-card/70 to-transparent"
          />
          <p className="sr-only">{t("moreRowsHint")}</p>
        </>
      ) : null}
    </div>
  );
}

function StatCard ({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="text-sm text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "warning"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon aria-hidden className="size-5" />
        </div>
      </div>
    </div>
  );
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

function formatQuantityDelta (
  delta: number,
  formatNumber: (value: number) => string,
): string {
  if (delta > 0) {
    return `+${formatNumber(delta)}`;
  }
  return formatNumber(delta);
}

function SectionCard ({
  title,
  viewAllHref,
  viewAllLabel,
  emptyMessage,
  hasItems,
  children,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyMessage: string;
  hasItems: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {viewAllHref && viewAllLabel ? (
          <LoadingLink
            className="text-sm font-medium text-primary hover:underline"
            href={viewAllHref}
          >
            {viewAllLabel}
          </LoadingLink>
        ) : null}
      </div>
      {hasItems ? (
        children
      ) : (
        <p className="p-8 text-center text-base text-muted-foreground">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

export function DashboardPanel ({
  stats,
  recentSales,
  recentMovements,
  lowStockProducts,
}: DashboardPanelProps) {
  const t = useTranslations("dashboard");
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          hint={t("stats.todaySalesCount", { count: stats.todaySalesCount })}
          icon={DollarSign}
          title={t("stats.todaySales")}
          value={formatCurrency(stats.todaySalesAmount)}
        />
        <StatCard
          icon={CalendarRange}
          title={t("stats.monthSales")}
          value={formatCurrency(stats.monthSalesAmount)}
        />
        <StatCard
          icon={AlertTriangle}
          title={t("stats.lowStockProducts")}
          tone="warning"
          value={format.number(stats.lowStockCount)}
        />
      </div>

      <SectionCard
        emptyMessage={t("recentSales.empty")}
        hasItems={recentSales.length > 0}
        title={t("recentSales.title")}
        viewAllHref="/sales"
        viewAllLabel={t("recentSales.viewAll")}
      >
          <DashboardTablePreview totalCount={recentSales.length}>
            <Table containerClassName="overflow-x-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] px-4 py-3">
                    {t("recentSales.columns.receipt")}
                  </TableHead>
                  <TableHead className="min-w-[120px] px-4 py-3">
                    {t("recentSales.columns.date")}
                  </TableHead>
                  <TableHead className="min-w-[120px] px-4 py-3">
                    {t("recentSales.columns.cashier")}
                  </TableHead>
                  <TableHead className="min-w-[100px] px-4 py-3">
                    {t("recentSales.columns.payment")}
                  </TableHead>
                  <TableHead className="min-w-[100px] px-4 py-3 text-right">
                    {t("recentSales.columns.total")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.slice(0, DASHBOARD_TABLE_ROW_LIMIT).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="px-4 py-3 font-medium whitespace-nowrap">
                      <LoadingLink
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        href={`/pos/receipt/${sale.id}`}
                      >
                        <Receipt aria-hidden className="size-3.5" />
                        {sale.receiptNumber}
                      </LoadingLink>
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
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {tPos(sale.paymentMethod)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DashboardTablePreview>
      </SectionCard>

      <SectionCard
        emptyMessage={t("recentMovements.empty")}
        hasItems={recentMovements.length > 0}
        title={t("recentMovements.title")}
        viewAllHref="/stock/movements"
        viewAllLabel={t("recentMovements.viewAll")}
      >
          <DashboardTablePreview totalCount={recentMovements.length}>
            <Table containerClassName="overflow-x-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] px-4 py-3">
                    {t("recentMovements.columns.date")}
                  </TableHead>
                  <TableHead className="min-w-[160px] px-4 py-3">
                    {t("recentMovements.columns.product")}
                  </TableHead>
                  <TableHead className="min-w-[100px] px-4 py-3">
                    {t("recentMovements.columns.type")}
                  </TableHead>
                  <TableHead className="min-w-[80px] px-4 py-3 text-right">
                    {t("recentMovements.columns.quantity")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.slice(0, DASHBOARD_TABLE_ROW_LIMIT).map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="px-4 py-3 tabular-nums whitespace-nowrap">
                      {format.dateTime(new Date(movement.createdAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <div className="font-medium">{movement.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {movement.productSku}
                      </div>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DashboardTablePreview>
      </SectionCard>

      <SectionCard
        emptyMessage={t("lowStock.empty")}
        hasItems={lowStockProducts.length > 0}
        title={t("lowStock.title")}
        viewAllHref="/products"
        viewAllLabel={t("lowStock.viewAll")}
      >
        <DashboardTablePreview totalCount={lowStockProducts.length}>
          <Table containerClassName="overflow-x-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px] px-4 py-3">
                  {t("lowStock.columns.product")}
                </TableHead>
                <TableHead className="min-w-[100px] px-4 py-3">
                  {t("lowStock.columns.sku")}
                </TableHead>
                <TableHead className="min-w-[80px] px-4 py-3 text-right">
                  {t("lowStock.columns.currentStock")}
                </TableHead>
                <TableHead className="min-w-[80px] px-4 py-3 text-right">
                  {t("lowStock.columns.minimumStock")}
                </TableHead>
                <TableHead className="min-w-[100px] px-4 py-3 text-right">
                  {t("lowStock.columns.price")}
                </TableHead>
                <TableHead className="min-w-[100px] px-4 py-3">
                  {t("lowStock.columns.status")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.slice(0, DASHBOARD_TABLE_ROW_LIMIT).map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="px-4 py-3 font-medium whitespace-normal">
                    <LoadingLink
                      className="hover:text-primary hover:underline"
                      href={`/products/${product.id}/edit`}
                    >
                      {product.name}
                    </LoadingLink>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {product.sku}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {format.number(product.currentStock)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {format.number(product.minimumStock)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(product.sellingPrice)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="destructive">{t("lowStock.badge")}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardTablePreview>
      </SectionCard>
    </div>
  );
}
