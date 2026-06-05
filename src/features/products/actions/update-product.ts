"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { userIsOwner } from "@/features/auth/types/current-user";
import { getProductCostPrice } from "@/features/products/services/get-product";
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
  const user = await requireModuleAccess("products");

  const parsed = UpdateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  let payload: UpdateProductInput = parsed.data;

  if (!userIsOwner(user)) {
    const existingCostPrice = await getProductCostPrice(payload.productId);
    if (existingCostPrice === null) {
      return { ok: false, code: "not_found" };
    }
    payload = { ...payload, costPrice: existingCostPrice };
  }
  const result = await updateProductRecord(payload);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, productId: result.productId };
}
