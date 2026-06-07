import "server-only";

import {
  mapPosProductRows,
  POS_PRODUCT_SELECT,
  type PosProductRow,
} from "@/features/sales/lib/map-pos-product";
import type { PosProductHit } from "@/features/sales/types/pos";
import type { LookupOption } from "@/features/products/types/product";
import { requireCurrentUser } from "@/features/auth/services/get-current-user";
import { sortPosProductsByQuantitySold } from "@/features/sales/lib/sort-pos-products-by-sales";
import { getProductQuantitySoldMap } from "@/features/sales/services/get-product-quantity-sold-map";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { POS_BROWSE_PAGE_SIZE } from "@/features/sales/constants/pos-browse";

export type ListProductsForPosFilters = {
  categoryId?: string | null;
  page?: number;
  pageSize?: number;
};

export type ListProductsForPosResult = {
  products: PosProductHit[];
  totalCount: number;
  hasMore: boolean;
};

export async function listPosCategoryOptions (): Promise<LookupOption[]> {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("status", "ACTIVE")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({ id: row.id, name: row.name }));
}

export async function listProductsForPos (
  filters: ListProductsForPosFilters = {},
): Promise<ListProductsForPosResult> {
  await requireCurrentUser();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? POS_BROWSE_PAGE_SIZE;
  const from = (page - 1) * pageSize;

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("products")
    .select(POS_PRODUCT_SELECT, { count: "exact" })
    .eq("status", "ACTIVE");

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  const [productsResult, quantitySoldByProductId] = await Promise.all([
    query,
    getProductQuantitySoldMap(supabase),
  ]);

  const { data, error, count } = productsResult;

  if (error || !data) {
    return { products: [], totalCount: 0, hasMore: false };
  }

  const totalCount = count ?? 0;
  const sortedRows = sortPosProductsByQuantitySold(
    data as unknown as PosProductRow[],
    quantitySoldByProductId,
  );
  const pageRows = sortedRows.slice(from, from + pageSize);
  const products = mapPosProductRows(supabase, pageRows);

  return {
    products,
    totalCount,
    hasMore: from + products.length < totalCount,
  };
}
