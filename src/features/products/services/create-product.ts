import "server-only";

import type { CreateProductInput } from "@/features/products/validations/product-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateProductFailureCode =
  | "sku_taken"
  | "category_not_found"
  | "insert_failed";

export type CreateProductResult =
  | { ok: true; productId: string }
  | { ok: false; code: CreateProductFailureCode };

function emptyToNull (value: string | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

export async function createProductRecord (
  input: CreateProductInput,
): Promise<CreateProductResult> {
  const supabase = await createSupabaseServerClient();

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
      return { ok: false, code: "insert_failed" };
    }
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      description: emptyToNull(input.description),
      category_id: input.categoryId,
      supplier_id: input.supplierId,
      size: emptyToNull(input.size),
      color: emptyToNull(input.color),
      cost_price: input.costPrice,
      selling_price: input.sellingPrice,
      current_stock: input.currentStock,
      minimum_stock: input.minimumStock,
      image_path: input.imagePath ?? null,
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, code: "sku_taken" };
    }
    return { ok: false, code: "insert_failed" };
  }

  return { ok: true, productId: data.id };
}
