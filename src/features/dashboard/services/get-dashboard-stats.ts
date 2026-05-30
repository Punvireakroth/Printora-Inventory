import "server-only";

import type { DashboardStats } from "@/features/dashboard/types/dashboard";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import {
  getBusinessDayRange,
  getBusinessMonthRange,
} from "@/lib/business-date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SaleTotalRow = {
  total: number;
};

type ProductStockRow = {
  current_stock: number;
  minimum_stock: number;
};

function sumSaleTotals (rows: SaleTotalRow[] | null): number {
  if (!rows) {
    return 0;
  }

  return rows.reduce((sum, row) => sum + Number(row.total), 0);
}

function countLowStockProducts (rows: ProductStockRow[] | null): number {
  if (!rows) {
    return 0;
  }

  return rows.filter(
    (row) => row.current_stock <= row.minimum_stock,
  ).length;
}

export async function getDashboardStats (): Promise<DashboardStats> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const dayRange = getBusinessDayRange();
  const monthRange = getBusinessMonthRange();

  const [
    todaySalesResult,
    monthSalesResult,
    totalProductsResult,
    productStockResult,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("total")
      .eq("status", "COMPLETED")
      .gte("completed_at", dayRange.startIso)
      .lte("completed_at", dayRange.endIso),
    supabase
      .from("sales")
      .select("total")
      .eq("status", "COMPLETED")
      .gte("completed_at", monthRange.startIso)
      .lte("completed_at", monthRange.endIso),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    supabase
      .from("products")
      .select("current_stock, minimum_stock")
      .eq("status", "ACTIVE"),
  ]);

  if (todaySalesResult.error) {
    console.error("[getDashboardStats] todaySales", todaySalesResult.error);
  }
  if (monthSalesResult.error) {
    console.error("[getDashboardStats] monthSales", monthSalesResult.error);
  }
  if (totalProductsResult.error) {
    console.error("[getDashboardStats] totalProducts", totalProductsResult.error);
  }
  if (productStockResult.error) {
    console.error("[getDashboardStats] productStock", productStockResult.error);
  }

  const todayRows = (todaySalesResult.data ?? []) as SaleTotalRow[];

  return {
    todaySalesAmount: sumSaleTotals(todayRows),
    todaySalesCount: todayRows.length,
    monthSalesAmount: sumSaleTotals(
      (monthSalesResult.data ?? []) as SaleTotalRow[],
    ),
    totalProducts: totalProductsResult.count ?? 0,
    lowStockCount: countLowStockProducts(
      (productStockResult.data ?? []) as ProductStockRow[],
    ),
  };
}
