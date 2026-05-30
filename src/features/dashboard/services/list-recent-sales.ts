import "server-only";

import type { DashboardRecentSale } from "@/features/dashboard/types/dashboard";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/features/sales/types/pos";

type RecentSaleRow = {
  id: string;
  receipt_number: string;
  total: number;
  payment_method: PaymentMethod;
  completed_at: string;
  users: { full_name: string | null } | { full_name: string | null }[] | null;
};

const RECENT_SALE_SELECT =
  "id, receipt_number, total, payment_method, completed_at, users(full_name)" as const;

function relationFullName (
  relation: { full_name: string | null } | { full_name: string | null }[] | null,
): string {
  if (!relation) {
    return "—";
  }

  const row = Array.isArray(relation) ? relation[0] : relation;
  return row?.full_name?.trim() || "—";
}

function mapRecentSaleRow (row: RecentSaleRow): DashboardRecentSale {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    cashierName: relationFullName(row.users),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    completedAt: row.completed_at,
  };
}

export async function listRecentSales (
  limit = 10,
): Promise<DashboardRecentSale[]> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sales")
    .select(RECENT_SALE_SELECT)
    .eq("status", "COMPLETED")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listRecentSales]", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return (data as unknown as RecentSaleRow[]).map(mapRecentSaleRow);
}
