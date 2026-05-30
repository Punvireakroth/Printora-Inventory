import "server-only";

import type { SaleListItem, SaleStatus } from "@/features/sales/types/sale-list-item";
import type { PaymentMethod } from "@/features/sales/types/pos";
import { requireCurrentUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dateOnlyToEndIso, dateOnlyToStartIso } from "@/lib/date-range";

type SaleListRow = {
  id: string;
  receipt_number: string;
  completed_at: string;
  total: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
};

const SALE_LIST_SELECT =
  "id, receipt_number, completed_at, total, payment_method, status" as const;

function mapListRow (row: SaleListRow): SaleListItem {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    completedAt: row.completed_at,
    total: Number(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
  };
}

export type ListMySalesFilters = {
  dateFrom?: string;
  dateTo?: string;
};

export async function listMySales (
  filters: ListMySalesFilters = {},
): Promise<SaleListItem[]> {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("sales")
    .select(SALE_LIST_SELECT)
    .eq("cashier_id", user.id)
    .order("completed_at", { ascending: false });

  if (filters.dateFrom) {
    query = query.gte("completed_at", dateOnlyToStartIso(filters.dateFrom));
  }

  if (filters.dateTo) {
    query = query.lte("completed_at", dateOnlyToEndIso(filters.dateTo));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[listMySales]", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return (data as SaleListRow[]).map(mapListRow);
}
