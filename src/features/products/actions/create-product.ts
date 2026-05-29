"use server";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
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
  await requireOwnerUser();

  const parsed = CreateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const payload: CreateProductInput = parsed.data;
  const result = await createProductRecord(payload);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, productId: result.productId };
}
