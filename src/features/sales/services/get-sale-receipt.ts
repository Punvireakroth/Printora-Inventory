import "server-only";

import type { SaleReceipt } from "@/features/sales/types/pos";
import { requireCurrentUser } from "@/features/auth/services/get-current-user";
import { userIsOwner } from "@/features/auth/types/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SaleRow = {
  id: string;
  receipt_number: string;
  cashier_id: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  payment_method: SaleReceipt["paymentMethod"];
  locale_at_sale: "en" | "km";
  completed_at: string;
  users: { full_name: string | null } | { full_name: string | null }[] | null;
};

type SaleItemRow = {
  id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price: number;
  line_discount: number;
  line_total: number;
};

function relationFullName (
  relation: { full_name: string | null } | { full_name: string | null }[] | null,
): string {
  if (!relation) {
    return "—";
  }
  const row = Array.isArray(relation) ? relation[0] : relation;
  return row?.full_name?.trim() || "—";
}

export async function getSaleReceipt (
  saleId: string,
): Promise<SaleReceipt | null> {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseServerClient();

  const saleQuery = supabase
    .from("sales")
    .select(
      "id, receipt_number, cashier_id, subtotal, discount_amount, total, payment_method, locale_at_sale, completed_at, users(full_name)",
    )
    .eq("id", saleId)
    .maybeSingle();

  const [saleResult, settingsResult, itemsResult] = await Promise.all([
    saleQuery,
    supabase
      .from("system_settings")
      .select("business_name")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("sale_items")
      .select(
        "id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_discount, line_total",
      )
      .eq("sale_id", saleId)
      .order("created_at", { ascending: true }),
  ]);

  const sale = saleResult.data as SaleRow | null;
  if (saleResult.error || !sale) {
    return null;
  }

  if (!userIsOwner(user) && sale.cashier_id !== user.id) {
    return null;
  }

  const items = (itemsResult.data ?? []) as SaleItemRow[];

  return {
    id: sale.id,
    receiptNumber: sale.receipt_number,
    cashierName: relationFullName(sale.users),
    completedAt: sale.completed_at,
    subtotal: Number(sale.subtotal),
    discountAmount: Number(sale.discount_amount),
    total: Number(sale.total),
    paymentMethod: sale.payment_method,
    localeAtSale: sale.locale_at_sale,
    businessName: settingsResult.data?.business_name ?? null,
    items: items.map((item) => ({
      id: item.id,
      productName: item.product_name_snapshot,
      sku: item.sku_snapshot,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineDiscount: Number(item.line_discount),
      lineTotal: Number(item.line_total),
    })),
  };
}
