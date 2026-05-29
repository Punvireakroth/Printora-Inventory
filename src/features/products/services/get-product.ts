import "server-only";

import {
  getProductImagePublicUrl,
  PRODUCT_IMAGES_BUCKET,
} from "@/features/products/lib/product-image";
import type { ProductDetail } from "@/features/products/types/product";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const PRODUCT_DETAIL_SELECT =
  "id, name, sku, description, size, color, cost_price, selling_price, current_stock, minimum_stock, image_path, status, category_id, supplier_id" as const;

type ProductDetailRow = Pick<
  ProductRow,
  | "id"
  | "name"
  | "sku"
  | "description"
  | "size"
  | "color"
  | "cost_price"
  | "selling_price"
  | "current_stock"
  | "minimum_stock"
  | "image_path"
  | "status"
  | "category_id"
  | "supplier_id"
>;

function mapProductDetail (
  row: ProductDetailRow,
  imageUrl: string | null,
): ProductDetail {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    description: row.description,
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
    supplierId: row.supplier_id,
  };
}

export async function getProductById (
  productId: string,
): Promise<ProductDetail | null> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const storage = supabase.storage.from(PRODUCT_IMAGES_BUCKET);
  const imageUrl = getProductImagePublicUrl(
    (path) => storage.getPublicUrl(path),
    data.image_path,
  );

  return mapProductDetail(data, imageUrl);
}
