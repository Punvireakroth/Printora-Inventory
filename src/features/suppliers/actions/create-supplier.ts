"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { createSupplierRecord } from "@/features/suppliers/services/create-supplier";
import {
  CreateSupplierSchema,
  type CreateSupplierInput,
} from "@/features/suppliers/validations/supplier-schema";

export type CreateSupplierErrorCode = "invalid_input" | "insert_failed";

export type CreateSupplierActionResult =
  | { ok: true; supplierId: string }
  | { ok: false; code: CreateSupplierErrorCode };

export async function createSupplier (
  input: unknown,
): Promise<CreateSupplierActionResult> {
  await requireModuleAccess("suppliers");

  const parsed = CreateSupplierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const payload: CreateSupplierInput = parsed.data;
  const result = await createSupplierRecord(payload);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, supplierId: result.supplierId };
}
