import "server-only";

import type { StockReceiveInput } from "@/features/stock/validations/stock-receive-schema";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateStockReceiveFailureCode =
  | "forbidden"
  | "not_authenticated"
  | "no_items"
  | "supplier_not_found"
  | "product_not_found"
  | "invalid_quantity"
  | "invalid_unit_cost"
  | "duplicate_product"
  | "rpc_not_deployed"
  | "insert_failed";

export type CreateStockReceiveResult =
  | { ok: true; receiveId: string }
  | { ok: false; code: CreateStockReceiveFailureCode };

type RpcErrorShape = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function mapRpcError (error: RpcErrorShape): CreateStockReceiveFailureCode {
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
    || normalized.includes("function public.create_stock_receive")
  ) {
    return "rpc_not_deployed";
  }

  if (normalized.includes("forbidden") || normalized.includes("not_authenticated")) {
    return "forbidden";
  }
  if (normalized.includes("no_items")) {
    return "no_items";
  }
  if (normalized.includes("supplier_not_found")) {
    return "supplier_not_found";
  }
  if (normalized.includes("product_not_found")) {
    return "product_not_found";
  }
  if (normalized.includes("invalid_quantity")) {
    return "invalid_quantity";
  }
  if (normalized.includes("invalid_unit_cost")) {
    return "invalid_unit_cost";
  }
  if (normalized.includes("duplicate") || normalized.includes("unique")) {
    return "duplicate_product";
  }

  return "insert_failed";
}

function receivedAtToTimestamptz (dateOnly: string): string {
  return `${dateOnly}T12:00:00.000Z`;
}

export async function createStockReceiveRecord (
  input: StockReceiveInput,
): Promise<CreateStockReceiveResult> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const rpcItems = input.items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
    unit_cost: item.unitCost,
  }));

  const { data, error } = await supabase.rpc("create_stock_receive", {
    p_supplier_id: input.supplierId,
    p_received_at: receivedAtToTimestamptz(input.receivedAt),
    p_notes: input.notes?.trim() ?? "",
    p_items: rpcItems,
  });

  if (error) {
    console.error("[createStockReceive]", error);
    return { ok: false, code: mapRpcError(error) };
  }

  if (!data || typeof data !== "string") {
    return { ok: false, code: "insert_failed" };
  }

  return { ok: true, receiveId: data };
}
