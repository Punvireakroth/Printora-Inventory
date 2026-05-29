"use server";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createStockReceiveRecord } from "@/features/stock/services/create-stock-receive";
import type { CreateStockReceiveFailureCode } from "@/features/stock/services/create-stock-receive";
import { StockReceiveSchema } from "@/features/stock/validations/stock-receive-schema";

export type CreateStockReceiveActionResult =
  | { ok: true; receiveId: string }
  | { ok: false; code: CreateStockReceiveFailureCode | "invalid_input" };

export async function createStockReceive (
  input: unknown,
): Promise<CreateStockReceiveActionResult> {
  await requireOwnerUser();

  const parsed = StockReceiveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const result = await createStockReceiveRecord(parsed.data);
  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, receiveId: result.receiveId };
}
