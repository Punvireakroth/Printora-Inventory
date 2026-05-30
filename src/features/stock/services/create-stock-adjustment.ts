import "server-only";

import type { StockAdjustmentInput } from "@/features/stock/validations/stock-adjustment-schema";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateStockAdjustmentFailureCode =
  | "forbidden"
  | "not_authenticated"
  | "product_not_found"
  | "invalid_quantity"
  | "invalid_reason"
  | "no_change"
  | "rpc_not_deployed"
  | "insert_failed";

export type CreateStockAdjustmentResult =
  | { ok: true; adjustmentId: string }
  | { ok: false; code: CreateStockAdjustmentFailureCode };

type RpcErrorShape = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function mapRpcError (error: RpcErrorShape): CreateStockAdjustmentFailureCode {
  const normalized = [
    error.message,
    error.details,
    error.hint,
    error.code,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    error.code === "PGRST202"
    || normalized.includes("could not find the function")
    || normalized.includes("function public.create_stock_adjustment")
  ) {
    return "rpc_not_deployed";
  }

  if (normalized.includes("forbidden") || normalized.includes("not_authenticated")) {
    return "forbidden";
  }
  if (normalized.includes("product_not_found")) {
    return "product_not_found";
  }
  if (normalized.includes("invalid_quantity") || normalized.includes("check constraint")) {
    return "invalid_quantity";
  }
  if (normalized.includes("invalid_reason")) {
    return "invalid_reason";
  }
  if (normalized.includes("no_change")) {
    return "no_change";
  }

  return "insert_failed";
}

export async function createStockAdjustmentRecord (
  input: StockAdjustmentInput,
): Promise<CreateStockAdjustmentResult> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_stock_adjustment", {
    p_product_id: input.productId,
    p_new_quantity: input.newQuantity,
    p_reason: input.reason.trim(),
  });

  if (error) {
    console.error("[createStockAdjustment]", error);
    return { ok: false, code: mapRpcError(error) };
  }

  if (!data || typeof data !== "string") {
    return { ok: false, code: "insert_failed" };
  }

  return { ok: true, adjustmentId: data };
}
