"use client";

import type {
  BestSellerChartPoint,
  ProfitComparisonChartPoint,
  SalesAnalyticsReport,
} from "@/features/reports/types/sales-analytics";
import { MySalesFilters } from "@/features/sales/components/my-sales-filters";
import { cn, formatCurrency } from "@/lib/utils";
import { BarChart3, DollarSign, Package, TrendingUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SalesReportsPanelProps = {
  report: SalesAnalyticsReport;
  activePeriod?: "today" | "week" | "month" | "";
};


const CHART_COLORS = {
  quantity: "var(--brand-red)",
  unitPrice: "var(--brand-red)",
  costPrice: "var(--brand-neutral-gray)",
  profit: "#059669",
};

function SummaryCard ({
  title,
  value,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "positive";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p
            className={cn(
              "font-heading text-xl font-semibold tracking-tight tabular-nums sm:text-2xl",
              tone === "positive" && "text-emerald-700 dark:text-emerald-400",
            )}
          >
            {value}
          </p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon aria-hidden className="size-4" />
        </div>
      </div>
    </div>
  );
}

function ChartCard ({
  title,
  description,
  children,
  emptyMessage,
  isEmpty,
}: {
  title: string;
  description: string;
  children: ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {isEmpty ? (
        <p className="flex min-h-[280px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

function BestSellersChart ({
  data,
}: {
  data: BestSellerChartPoint[];
}) {
  const t = useTranslations("reports.charts.bestSellers");
  const format = useFormatter();

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            type="number"
          />
          <YAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            type="category"
            width={112}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) {
                return null;
              }

              const point = payload[0]?.payload as BestSellerChartPoint | undefined;
              if (!point) {
                return null;
              }

              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
                  <p className="font-medium text-popover-foreground">
                    {point.productName}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {t("tooltipQuantity", { count: point.quantitySold })}
                  </p>
                  <p className="text-muted-foreground">
                    {t("tooltipSales", {
                      amount: formatCurrency(point.salesAmount),
                    })}
                  </p>
                </div>
              );
            }}
            cursor={{ fill: "color-mix(in srgb, var(--muted) 45%, transparent)" }}
          />
          <Bar
            barSize={18}
            dataKey="quantitySold"
            name={t("quantityLabel")}
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry) => (
              <Cell fill={CHART_COLORS.quantity} key={entry.key} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProfitComparisonChart ({
  data,
}: {
  data: ProfitComparisonChartPoint[];
}) {
  const t = useTranslations("reports.charts.profitComparison");
  const format = useFormatter();

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            interval={0}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value: number) =>
              formatCurrency(value, {
                maximumFractionDigits: 0,
              })
            }
            tickLine={false}
            width={56}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) {
                return null;
              }

              const point = payload[0]?.payload as ProfitComparisonChartPoint | undefined;
              if (!point) {
                return null;
              }

              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
                  <p className="font-medium text-popover-foreground">
                    {point.productName}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {t("tooltipUnitPrice", {
                      amount: formatCurrency(point.unitPrice),
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {t("tooltipCostPrice", {
                      amount: formatCurrency(point.costPrice),
                    })}
                  </p>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">
                    {t("tooltipProfitPerUnit", {
                      amount: formatCurrency(point.profitPerUnit),
                    })}
                  </p>
                </div>
              );
            }}
            cursor={{ fill: "color-mix(in srgb, var(--muted) 45%, transparent)" }}
          />
          <Legend
            formatter={(value) => (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
            iconSize={10}
            iconType="circle"
            wrapperStyle={{ paddingTop: 12 }}
          />
          <Bar
            barSize={16}
            dataKey="unitPrice"
            fill={CHART_COLORS.unitPrice}
            name={t("unitPriceLabel")}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            barSize={16}
            dataKey="costPrice"
            fill={CHART_COLORS.costPrice}
            name={t("costPriceLabel")}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            barSize={16}
            dataKey="profitPerUnit"
            fill={CHART_COLORS.profit}
            name={t("profitPerUnitLabel")}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SalesReportsPanel ({
  report,
  activePeriod,
}: SalesReportsPanelProps) {
  const t = useTranslations("reports");
  const format = useFormatter();
  const { summary } = report;
  const isEmpty = report.bestSellers.length === 0;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        {/* <p className="text-base text-muted-foreground">{t("subtitle")}</p> */}
      </div>

      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        }
      >
        <MySalesFilters activePeriod={activePeriod} namespace="reports" />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Package}
          title={t("summary.quantitySold")}
          value={format.number(summary.quantitySold)}
        />
        <SummaryCard
          icon={DollarSign}
          title={t("summary.salesAmount")}
          value={formatCurrency(summary.salesAmount)}
        />
        <SummaryCard
          icon={BarChart3}
          title={t("summary.costAmount")}
          value={formatCurrency(summary.costAmount)}
        />
        <SummaryCard
          icon={TrendingUp}
          title={t("summary.profitAmount")}
          tone="positive"
          value={formatCurrency(summary.profitAmount)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          description={t("charts.bestSellers.description")}
          emptyMessage={t("empty")}
          isEmpty={isEmpty}
          title={t("charts.bestSellers.title")}
        >
          <BestSellersChart data={report.bestSellers} />
        </ChartCard>

        <ChartCard
          description={t("charts.profitComparison.description")}
          emptyMessage={t("empty")}
          isEmpty={isEmpty}
          title={t("charts.profitComparison.title")}
        >
          <ProfitComparisonChart data={report.profitComparison} />
        </ChartCard>
      </div>
    </div>
  );
}
