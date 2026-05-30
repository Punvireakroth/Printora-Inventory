import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { getDashboardStats } from "@/features/dashboard/services/get-dashboard-stats";
import { listLowStockProducts } from "@/features/dashboard/services/list-low-stock-products";
import { listRecentSales } from "@/features/dashboard/services/list-recent-sales";
import { listStockMovements } from "@/features/stock/services/list-stock-movements";
import { getTranslations } from "next-intl/server";

const DASHBOARD_TABLE_ROW_LIMIT = 4;
const DASHBOARD_FETCH_LIMIT = DASHBOARD_TABLE_ROW_LIMIT + 1;

export async function generateMetadata () {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default async function DashboardPage () {
  await requireOwnerUser();

  const [stats, recentSales, recentMovements, lowStockProducts] =
    await Promise.all([
      getDashboardStats(),
      listRecentSales(DASHBOARD_FETCH_LIMIT),
      listStockMovements({ limit: DASHBOARD_FETCH_LIMIT }),
      listLowStockProducts(DASHBOARD_FETCH_LIMIT),
    ]);

  return (
    <DashboardPanel
      lowStockProducts={lowStockProducts}
      recentMovements={recentMovements}
      recentSales={recentSales}
      stats={stats}
    />
  );
}
