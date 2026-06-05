import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { requireModuleAccess } from "@/features/auth/services/module-access";
import { StockReceivesPanel } from "@/features/stock/components/stock-receives-panel";
import { listStockReceives } from "@/features/stock/services/list-stock-receives";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("stock.receives");
  return { title: t("title") };
}

export default async function StockReceivesPage () {
  await requireModuleAccess("stock");
  const t = await getTranslations("stock.receives");
  const tNav = await getTranslations("navigation");

  const receives = await listStockReceives();

  return (
    <div className="flex w-full flex-col gap-6">
      <PageBreadcrumb
        ariaLabel={t("breadcrumbAria")}
        items={[
          { label: tNav("dashboard"), href: "/dashboard" },
          { label: t("title") },
        ]}
      />

      <StockReceivesPanel receives={receives} />
    </div>
  );
}
