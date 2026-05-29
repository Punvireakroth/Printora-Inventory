import "server-only";

import type { UpdateProductInput } from "@/features/products/validations/product-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateProductFailureCode =
  | "not_found"
  | "sku_taken"
  | "category_not_found"
  | "update_failed";

export type UpdateProductResult =
  | { ok: true; productId: string }
  | { ok: false; code: UpdateProductFailureCode };

function emptyToNull (value: string | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

export async function updateProductRecord (
  input: UpdateProductInput,
): Promise<UpdateProductResult> {
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("id")
    .eq("id", input.productId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, code: "not_found" };
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", input.categoryId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (categoryError || !category) {
    return { ok: false, code: "category_not_found" };
  }

  if (input.supplierId) {
    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("id", input.supplierId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (supplierError || !supplier) {
      return { ok: false, code: "update_failed" };
    }
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      description: emptyToNull(input.description),
      category_id: input.categoryId,
      supplier_id: input.supplierId,
      size: emptyToNull(input.size),
      color: emptyToNull(input.color),
      cost_price: input.costPrice,
      selling_price: input.sellingPrice,
      minimum_stock: input.minimumStock,
      image_path: input.imagePath ?? null,
    })
    .eq("id", input.productId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, code: "sku_taken" };
    }
    return { ok: false, code: "update_failed" };
  }

  return { ok: true, productId: input.productId };
}
