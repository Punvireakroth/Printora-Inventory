"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import {
  createStockAdjustmentRecord,
  type CreateStockAdjustmentFailureCode,
} from "@/features/stock/services/create-stock-adjustment";
import { StockAdjustmentSchema } from "@/features/stock/validations/stock-adjustment-schema";

export type CreateStockAdjustmentActionResult =
  | { ok: true; adjustmentId: string }
  | { ok: false; code: CreateStockAdjustmentFailureCode | "invalid_input" };

export async function createStockAdjustment (
  input: unknown,
): Promise<CreateStockAdjustmentActionResult> {
  await requireModuleAccess("stock");

  const parsed = StockAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const result = await createStockAdjustmentRecord(parsed.data);
  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, adjustmentId: result.adjustmentId };
}
