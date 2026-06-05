"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { updateCategoryRecord } from "@/features/categories/services/update-category";
import {
  UpdateCategorySchema,
  type UpdateCategoryInput,
} from "@/features/categories/validations/category-schema";

export type UpdateCategoryErrorCode =
  | "invalid_input"
  | "not_found"
  | "update_failed";

export type UpdateCategoryActionResult =
  | { ok: true }
  | { ok: false; code: UpdateCategoryErrorCode };

export async function updateCategory (
  input: unknown,
): Promise<UpdateCategoryActionResult> {
  await requireModuleAccess("categories");

  const parsed = UpdateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const payload: UpdateCategoryInput = parsed.data;
  const result = await updateCategoryRecord(payload);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true };
}
