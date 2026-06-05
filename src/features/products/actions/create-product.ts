"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { userIsOwner } from "@/features/auth/types/current-user";
import { createProductRecord } from "@/features/products/services/create-product";
import {
  CreateProductSchema,
  type CreateProductInput,
} from "@/features/products/validations/product-schema";

export type CreateProductErrorCode =
  | "invalid_input"
  | "sku_taken"
  | "category_not_found"
  | "insert_failed";

export type CreateProductActionResult =
  | { ok: true; productId: string }
  | { ok: false; code: CreateProductErrorCode };

export async function createProduct (
  input: unknown,
): Promise<CreateProductActionResult> {
  const user = await requireModuleAccess("products");

  const parsed = CreateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const payload: CreateProductInput = userIsOwner(user)
    ? parsed.data
    : { ...parsed.data, costPrice: 0 };
  const result = await createProductRecord(payload);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, productId: result.productId };
}
