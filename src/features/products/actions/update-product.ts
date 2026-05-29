"use server";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { updateProductRecord } from "@/features/products/services/update-product";
import {
  UpdateProductSchema,
  type UpdateProductInput,
} from "@/features/products/validations/product-schema";

export type UpdateProductErrorCode =
  | "invalid_input"
  | "not_found"
  | "sku_taken"
  | "category_not_found"
  | "update_failed";

export type UpdateProductActionResult =
  | { ok: true; productId: string }
  | { ok: false; code: UpdateProductErrorCode };

export async function updateProduct (
  input: unknown,
): Promise<UpdateProductActionResult> {
  await requireOwnerUser();

  const parsed = UpdateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const payload: UpdateProductInput = parsed.data;
  const result = await updateProductRecord(payload);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, productId: result.productId };
}
