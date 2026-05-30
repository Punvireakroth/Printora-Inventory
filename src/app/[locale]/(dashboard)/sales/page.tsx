import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { SalesListPanel } from "@/features/sales/components/sales-list-panel";
import { listAllSales } from "@/features/sales/services/list-all-sales";
import {
  resolveSaleHistoryPeriod,
  type SaleHistoryPeriod,
} from "@/lib/date-range";
import { getTranslations } from "next-intl/server";

type SalesPageProps = {
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

  return {
    dateFrom: params.from,
    dateTo: params.to,
  };
}

export async function generateMetadata () {
  const t = await getTranslations("sales");
  return { title: t("title") };
}

export default async function SalesPage ({ searchParams }: SalesPageProps) {
  await requireOwnerUser();
  const params = await searchParams;
  const t = await getTranslations("sales");
  const tNav = await getTranslations("navigation");

  const { dateFrom, dateTo } = resolveDateFilters(params);
  const sales = await listAllSales({ dateFrom, dateTo });

  return (
    <div className="flex w-full flex-col gap-6">
      <PageBreadcrumb
        ariaLabel={t("breadcrumbAria")}
        items={[
          { label: tNav("dashboard"), href: "/dashboard" },
          { label: t("title") },
        ]}
      />

      <SalesListPanel sales={sales} />
    </div>
  );
}
