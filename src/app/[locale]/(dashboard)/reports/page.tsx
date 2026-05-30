import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { SalesReportsPanel } from "@/features/reports/components/sales-reports-panel";
import { getSalesAnalytics } from "@/features/reports/services/get-sales-analytics";
import {
  resolveSaleHistoryPeriod,
  type SaleHistoryPeriod,
} from "@/lib/date-range";
import { getTranslations } from "next-intl/server";

type ReportsPageProps = {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
  }>;
};

const PERIODS = new Set<SaleHistoryPeriod>(["today", "week", "month"]);

function parsePeriod (value: string | undefined): SaleHistoryPeriod | null {
  if (value && PERIODS.has(value as SaleHistoryPeriod)) {
    return value as SaleHistoryPeriod;
  }
  return null;
}

function resolveDateFilters (params: {
  period?: string;
  from?: string;
  to?: string;
}): { dateFrom?: string; dateTo?: string } {
  const preset = parsePeriod(params.period);
  if (preset) {
    const range = resolveSaleHistoryPeriod(preset);
    return { dateFrom: range.from, dateTo: range.to };
  }

  if (params.from || params.to) {
    return {
      dateFrom: params.from,
      dateTo: params.to,
    };
  }

  const defaultRange = resolveSaleHistoryPeriod("month");
  return { dateFrom: defaultRange.from, dateTo: defaultRange.to };
}

export async function generateMetadata () {
  const t = await getTranslations("reports");
  return { title: t("title") };
}

export default async function ReportsPage ({ searchParams }: ReportsPageProps) {
  await requireOwnerUser();
  const params = await searchParams;
  const t = await getTranslations("reports");
  const tNav = await getTranslations("navigation");

  const { dateFrom, dateTo } = resolveDateFilters(params);
  const report = await getSalesAnalytics({ dateFrom, dateTo });
  const hasExplicitFilter = Boolean(params.period);

  return (
    <div className="flex w-full flex-col gap-6">
      <PageBreadcrumb
        ariaLabel={t("breadcrumbAria")}
        items={[
          { label: tNav("dashboard"), href: "/dashboard" },
          { label: t("title") },
        ]}
      />

      <SalesReportsPanel
        activePeriod={hasExplicitFilter ? undefined : "month"}
        report={report}
      />
    </div>
  );
}
