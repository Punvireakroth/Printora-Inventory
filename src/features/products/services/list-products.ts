import "server-only";

import {
  getProductImagePublicUrl,
  PRODUCT_IMAGES_BUCKET,
} from "@/features/products/lib/product-image";
import type { ProductListItem } from "@/features/products/types/product";
import { requireModuleAccess } from "@/features/auth/services/module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type CategoryRow = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name"
>;
type SupplierRow = Pick<
  Database["public"]["Tables"]["suppliers"]["Row"],
  "id" | "name"
>;

/** Matches PRODUCT_LIST_SELECT — not the full products row. */
type ProductListRow = {
  id: string;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  image_path: string | null;
  status: Database["public"]["Tables"]["products"]["Row"]["status"];
  category_id: string;
  supplier_id: string | null;
  categories: CategoryRow | CategoryRow[] | null;
  suppliers: SupplierRow | SupplierRow[] | null;
};

const PRODUCT_LIST_SELECT =
  "id, name, sku, size, color, cost_price, selling_price, current_stock, minimum_stock, image_path, status, category_id, supplier_id, categories(id, name), suppliers(id, name)" as const;

function relationName<T extends { name: string }> (
  relation: T | T[] | null,
): string | null {
  if (!relation) {
    return null;
  }
  return Array.isArray(relation) ? relation[0]?.name ?? null : relation.name;
}

function sanitizeIlikeQuery (query: string): string {
  return query.replace(/[%_,()]/g, " ").trim();
}

function mapProductRow (
  row: ProductListRow,
  imageUrl: string | null,
): ProductListItem {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    size: row.size,
    color: row.color,
    costPrice: Number(row.cost_price),
    sellingPrice: Number(row.selling_price),
    currentStock: row.current_stock,
    minimumStock: row.minimum_stock,
    imagePath: row.image_path,
    imageUrl,
    status: row.status,
    categoryId: row.category_id,
    categoryName: relationName(row.categories) ?? "—",
    supplierId: row.supplier_id,
    supplierName: relationName(row.suppliers),
  };
}

export type ListProductsFilters = {
  query?: string;
  categoryId?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
};

export async function listProducts (
  filters: ListProductsFilters = {},
): Promise<ProductListItem[]> {
  await requireModuleAccess("products");

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .order("name", { ascending: true });

  const trimmedQuery = filters.query ? sanitizeIlikeQuery(filters.query) : "";
  if (trimmedQuery) {
    const pattern = `%${trimmedQuery}%`;
    query = query.or(`name.ilike.${pattern},sku.ilike.${pattern}`);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.status && filters.status !== "ALL") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  const storage = supabase.storage.from(PRODUCT_IMAGES_BUCKET);

  return (data as unknown as ProductListRow[]).map((row) =>
    mapProductRow(
      row,
      getProductImagePublicUrl(
        (path) => storage.getPublicUrl(path),
        row.image_path,
      ),
    ),
  );
}
