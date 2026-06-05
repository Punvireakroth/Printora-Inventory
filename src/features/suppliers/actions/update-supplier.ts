"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { updateSupplierRecord } from "@/features/suppliers/services/update-supplier";
import {
  UpdateSupplierSchema,
  type UpdateSupplierInput,
} from "@/features/suppliers/validations/supplier-schema";

export type UpdateSupplierErrorCode =
  | "invalid_input"
  | "not_found"
  | "update_failed";

export type UpdateSupplierActionResult =
  | { ok: true }
  | { ok: false; code: UpdateSupplierErrorCode };

export async function updateSupplier (
  input: unknown,
): Promise<UpdateSupplierActionResult> {
  await requireModuleAccess("suppliers");

  const parsed = UpdateSupplierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const payload: UpdateSupplierInput = parsed.data;
  const result = await updateSupplierRecord(payload);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true };
}
