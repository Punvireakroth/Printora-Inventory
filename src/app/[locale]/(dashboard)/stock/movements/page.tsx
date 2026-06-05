import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { requireModuleAccess } from "@/features/auth/services/module-access";
import { StockMovementsPanel } from "@/features/stock/components/stock-movements-panel";
import { listStockMovements } from "@/features/stock/services/list-stock-movements";
import type { StockMovementType } from "@/features/stock/types/stock-movement";
import { getTranslations } from "next-intl/server";

type StockMovementsPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    from?: string;
    to?: string;
  }>;
};

const MOVEMENT_TYPES = new Set<StockMovementType>([
  "STOCK_IN",
  "SALE",
  "ADJUSTMENT",
  "REFUND",
]);

function parseMovementType (value: string | undefined) {
  if (value && MOVEMENT_TYPES.has(value as StockMovementType)) {
    return value as StockMovementType;
  }
  return "ALL" as const;
}

export async function generateMetadata () {
  const t = await getTranslations("stock.movements");
  return { title: t("title") };
}

export default async function StockMovementsPage ({ searchParams }: StockMovementsPageProps) {
  await requireModuleAccess("stock");
  const params = await searchParams;
  const t = await getTranslations("stock.movements");
  const tNav = await getTranslations("navigation");

  const movements = await listStockMovements({
    query: params.q,
    movementType: parseMovementType(params.type),
    dateFrom: params.from,
    dateTo: params.to,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <PageBreadcrumb
        ariaLabel={t("breadcrumbAria")}
        items={[
          { label: tNav("dashboard"), href: "/dashboard" },
          { label: tNav("stock"), href: "/stock/receives" },
          { label: t("title") },
        ]}
      />

      <StockMovementsPanel movements={movements} />
    </div>
  );
}
