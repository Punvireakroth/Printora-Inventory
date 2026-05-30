import "server-only";

import type { OwnerSaleListItem, SaleStatus } from "@/features/sales/types/sale-list-item";
import type { PaymentMethod } from "@/features/sales/types/pos";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dateOnlyToEndIso, dateOnlyToStartIso } from "@/lib/date-range";

type SaleListRow = {
  id: string;
  receipt_number: string;
  completed_at: string;
  total: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  users: { full_name: string | null } | { full_name: string | null }[] | null;
};

const SALE_LIST_SELECT =
  "id, receipt_number, completed_at, total, payment_method, status, users(full_name)" as const;

function relationFullName (
  relation: { full_name: string | null } | { full_name: string | null }[] | null,
): string {
  if (!relation) {
    return "—";
  }

  const row = Array.isArray(relation) ? relation[0] : relation;
  return row?.full_name?.trim() || "—";
}

function mapListRow (row: SaleListRow): OwnerSaleListItem {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    completedAt: row.completed_at,
    total: Number(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
    cashierName: relationFullName(row.users),
  };
}

export type ListAllSalesFilters = {
  dateFrom?: string;
  dateTo?: string;
};

export async function listAllSales (
  filters: ListAllSalesFilters = {},
): Promise<OwnerSaleListItem[]> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("sales")
    .select(SALE_LIST_SELECT)
    .order("completed_at", { ascending: false });

  if (filters.dateFrom) {
    query = query.gte("completed_at", dateOnlyToStartIso(filters.dateFrom));
  }

  if (filters.dateTo) {
    query = query.lte("completed_at", dateOnlyToEndIso(filters.dateTo));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[listAllSales]", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return (data as unknown as SaleListRow[]).map(mapListRow);
}
