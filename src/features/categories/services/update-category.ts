import "server-only";

import type { UpdateCategoryInput } from "@/features/categories/validations/category-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateCategoryFailureCode = "not_found" | "update_failed";

export type UpdateCategoryResult =
  | { ok: true }
  | { ok: false; code: UpdateCategoryFailureCode };

export async function updateCategoryRecord (
  input: UpdateCategoryInput,
): Promise<UpdateCategoryResult> {
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", input.categoryId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, code: "not_found" };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() ? input.description.trim() : null,
    })
    .eq("id", input.categoryId);

  if (error) {
    console.error("updateCategoryRecord", error);
    return { ok: false, code: "update_failed" };
  }

  return { ok: true };
}
