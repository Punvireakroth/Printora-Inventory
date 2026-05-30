import "server-only";

import type { CompleteSaleInput } from "@/features/sales/validations/complete-sale-schema";
import { requireCurrentUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";

export type CompleteSaleFailureCode =
  | "forbidden"
  | "not_authenticated"
  | "no_items"
  | "invalid_product"
  | "invalid_quantity"
  | "invalid_discount"
  | "discount_not_allowed"
  | "product_not_found"
  | "insufficient_stock"
  | "duplicate_product"
  | "settings_not_found"
  | "rpc_not_deployed"
  | "insert_failed";

export type CompleteSaleResult =
  | { ok: true; saleId: string }
  | { ok: false; code: CompleteSaleFailureCode };

type RpcErrorShape = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function mapRpcError (error: RpcErrorShape): CompleteSaleFailureCode {
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
    || normalized.includes("function public.complete_sale")
  ) {
    return "rpc_not_deployed";
  }

  if (normalized.includes("not_authenticated")) {
    return "not_authenticated";
  }
  if (normalized.includes("forbidden")) {
    return "forbidden";
  }
  if (normalized.includes("no_items")) {
    return "no_items";
  }
  if (normalized.includes("invalid_product")) {
    return "invalid_product";
  }
  if (normalized.includes("invalid_quantity")) {
    return "invalid_quantity";
  }
  if (normalized.includes("invalid_discount")) {
    return "invalid_discount";
  }
  if (normalized.includes("discount_not_allowed")) {
    return "discount_not_allowed";
  }
  if (normalized.includes("product_not_found")) {
    return "product_not_found";
  }
  if (normalized.includes("insufficient_stock")) {
    return "insufficient_stock";
  }
  if (normalized.includes("duplicate_product")) {
    return "duplicate_product";
  }
  if (normalized.includes("settings_not_found")) {
    return "settings_not_found";
  }

  return "insert_failed";
}

export async function completeSaleRecord (
  input: CompleteSaleInput,
): Promise<CompleteSaleResult> {
  await requireCurrentUser();
  const localeRaw = await getLocale();
  const localeAtSale = localeRaw === "en" ? "en" : "km";

  const supabase = await createSupabaseServerClient();
  const rpcItems = input.items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
    line_discount: item.lineDiscount,
  }));

  const { data, error } = await supabase.rpc("complete_sale", {
    p_payment_method: input.paymentMethod,
    p_locale_at_sale: localeAtSale,
    p_items: rpcItems,
  });

  if (error) {
    console.error("[completeSale]", error);
    return { ok: false, code: mapRpcError(error) };
  }

  if (!data || typeof data !== "string") {
    return { ok: false, code: "insert_failed" };
  }

  return { ok: true, saleId: data };
}
