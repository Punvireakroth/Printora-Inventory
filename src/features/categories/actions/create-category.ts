"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { createCategoryRecord } from "@/features/categories/services/create-category";
import {
  CreateCategorySchema,
  type CreateCategoryInput,
} from "@/features/categories/validations/category-schema";

export type CreateCategoryErrorCode = "invalid_input" | "insert_failed";

export type CreateCategoryActionResult =
  | { ok: true; categoryId: string }
  | { ok: false; code: CreateCategoryErrorCode };

export async function createCategory (
  input: unknown,
): Promise<CreateCategoryActionResult> {
  await requireModuleAccess("categories");

  const parsed = CreateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const payload: CreateCategoryInput = parsed.data;
  const result = await createCategoryRecord(payload);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, categoryId: result.categoryId };
}
