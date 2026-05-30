import "server-only";

import type { DashboardLowStockProduct } from "@/features/dashboard/types/dashboard";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LowStockProductRow = {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
  selling_price: number;
};

const LOW_STOCK_SELECT =
  "id, name, sku, current_stock, minimum_stock, selling_price" as const;

function mapLowStockRow (row: LowStockProductRow): DashboardLowStockProduct {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    currentStock: row.current_stock,
    minimumStock: row.minimum_stock,
    sellingPrice: Number(row.selling_price),
  };
}

export async function listLowStockProducts (
  limit = 10,
): Promise<DashboardLowStockProduct[]> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(LOW_STOCK_SELECT)
    .eq("status", "ACTIVE")
    .order("current_stock", { ascending: true });

  if (error) {
    console.error("[listLowStockProducts]", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return (data as unknown as LowStockProductRow[])
    .filter((row) => row.current_stock <= row.minimum_stock)
    .slice(0, limit)
    .map(mapLowStockRow);
}
