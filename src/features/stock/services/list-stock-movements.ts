import "server-only";

import type {
  StockMovementListItem,
  StockMovementType,
} from "@/features/stock/types/stock-movement";
import { requireModuleAccess } from "@/features/auth/services/module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StockMovementListRow = {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  movement_type: StockMovementType;
  quantity_delta: number;
  old_stock: number;
  new_stock: number;
  created_at: string;
  created_by_name: string;
  notes: string | null;
};

const MOVEMENT_LIST_SELECT =
  "id, product_id, product_name, product_sku, movement_type, quantity_delta, old_stock, new_stock, created_at, created_by_name, notes" as const;

function sanitizeIlikeQuery (query: string): string {
  return query.replace(/[%_,()]/g, " ").trim();
}

function dateOnlyToStartIso (dateOnly: string): string {
  return `${dateOnly}T00:00:00.000Z`;
}

function dateOnlyToEndIso (dateOnly: string): string {
  return `${dateOnly}T23:59:59.999Z`;
}

function mapListRow (row: StockMovementListRow): StockMovementListItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    movementType: row.movement_type,
    quantityDelta: row.quantity_delta,
    oldStock: row.old_stock,
    newStock: row.new_stock,
    createdAt: row.created_at,
    createdByName: row.created_by_name,
    notes: row.notes,
  };
}

export type ListStockMovementsFilters = {
  query?: string;
  movementType?: StockMovementType | "ALL";
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
};

export async function listStockMovements (
  filters: ListStockMovementsFilters = {},
): Promise<StockMovementListItem[]> {
  await requireModuleAccess("stock");

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("stock_movements_list")
    .select(MOVEMENT_LIST_SELECT)
    .order("created_at", { ascending: false });

  const trimmedQuery = filters.query ? sanitizeIlikeQuery(filters.query) : "";
  if (trimmedQuery) {
    const pattern = `%${trimmedQuery}%`;
    query = query.or(`product_name.ilike.${pattern},product_sku.ilike.${pattern}`);
  }

  if (filters.movementType && filters.movementType !== "ALL") {
    query = query.eq("movement_type", filters.movementType);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", dateOnlyToStartIso(filters.dateFrom));
  }

  if (filters.dateTo) {
    query = query.lte("created_at", dateOnlyToEndIso(filters.dateTo));
  }

  if (filters.limit && filters.limit > 0) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[listStockMovements]", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return (data as unknown as StockMovementListRow[]).map(mapListRow);
}
