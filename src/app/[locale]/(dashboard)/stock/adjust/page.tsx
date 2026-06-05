import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { requireModuleAccess } from "@/features/auth/services/module-access";
import { StockAdjustmentForm } from "@/features/stock/components/stock-adjustment-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("stock.adjust");
  return { title: t("title") };
}

export default async function StockAdjustPage () {
  await requireModuleAccess("stock");
  const t = await getTranslations("stock.adjust");
  const tNav = await getTranslations("navigation");

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <PageBreadcrumb
          ariaLabel={t("breadcrumbAria")}
          items={[
            { label: tNav("dashboard"), href: "/dashboard" },
            { label: t("historyLink"), href: "/stock/receives" },
            { label: t("title") },
          ]}
        />
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-base text-muted-foreground">{t("subtitle")}</p>
      </div>

      <StockAdjustmentForm />
    </div>
  );
}
