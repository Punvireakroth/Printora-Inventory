import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { StockReceivesPanel } from "@/features/stock/components/stock-receives-panel";
import { listStockReceives } from "@/features/stock/services/list-stock-receives";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("stock.receives");
  return { title: t("title") };
}

export default async function StockReceivesPage () {
  await requireOwnerUser();
  const t = await getTranslations("stock.receives");
  const tNav = await getTranslations("navigation");

  const receives = await listStockReceives();

  return (
    <div className="flex w-full flex-col gap-6">
      <nav
        aria-label={t("breadcrumbAria")}
        className="text-base text-muted-foreground"
      >
        <Link className="hover:text-foreground" href="/dashboard">
          {tNav("dashboard")}
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span className="text-foreground">{t("title")}</span>
      </nav>

      <StockReceivesPanel receives={receives} />
    </div>
  );
}
