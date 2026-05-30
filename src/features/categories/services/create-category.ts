import "server-only";

import type { CreateCategoryInput } from "@/features/categories/validations/category-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateCategoryFailureCode = "insert_failed";

export type CreateCategoryResult =
  | { ok: true; categoryId: string }
  | { ok: false; code: CreateCategoryFailureCode };

export async function createCategoryRecord (
  input: CreateCategoryInput,
): Promise<CreateCategoryResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() ? input.description.trim() : null,
      sort_order: 0,
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (error) {
    console.error("createCategoryRecord", error);
    return { ok: false, code: "insert_failed" };
  }

  return { ok: true, categoryId: data.id };
}
