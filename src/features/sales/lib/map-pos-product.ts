import {
  getProductImagePublicUrl,
  PRODUCT_IMAGES_BUCKET,
} from "@/features/products/lib/product-image";
import { productIsLowStock } from "@/features/products/types/product";
import type { PosProductHit } from "@/features/sales/types/pos";
import type { SupabaseClient } from "@supabase/supabase-js";

type CategoryRow = { id: string; name: string };

export type PosProductRow = {
  id: string;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  image_path: string | null;
  category_id: string;
  categories: CategoryRow | CategoryRow[] | null;
};

export const POS_PRODUCT_SELECT =
  "id, name, sku, size, color, selling_price, current_stock, minimum_stock, image_path, category_id, categories(id, name)" as const;

function relationName<T extends { name: string }> (
  relation: T | T[] | null,
): string {
  if (!relation) {
    return "—";
  }
  return Array.isArray(relation) ? relation[0]?.name ?? "—" : relation.name;
}

export function mapPosProductRow (
  row: PosProductRow,
  imageUrl: string | null,
): PosProductHit {
  const currentStock = row.current_stock;
  const minimumStock = row.minimum_stock;

  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    size: row.size,
    color: row.color,
    sellingPrice: Number(row.selling_price),
    currentStock,
    minimumStock,
    imageUrl,
    categoryName: relationName(row.categories),
    isLowStock: productIsLowStock({ currentStock, minimumStock }),
  };
}

export function mapPosProductRows (
  supabase: SupabaseClient,
  rows: PosProductRow[],
): PosProductHit[] {
  const storage = supabase.storage.from(PRODUCT_IMAGES_BUCKET);
  const getPublicUrl = (path: string) => storage.getPublicUrl(path);

  return rows.map((row) =>
    mapPosProductRow(
      row,
      getProductImagePublicUrl(getPublicUrl, row.image_path),
    ),
  );
}
