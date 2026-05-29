import "server-only";

import type { StockReceiveListItem } from "@/features/stock/types/stock-receive";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupplierEmbed = { name: string } | { name: string }[] | null;
type UserEmbed = {
  full_name: string | null;
  email: string;
} | {
  full_name: string | null;
  email: string;
}[] | null;
type ItemCountEmbed = { count: number } | { count: number }[];

type StockReceiveListRow = {
  id: string;
  reference_number: string | null;
  received_at: string;
  notes: string | null;
  received_by: string;
  suppliers: SupplierEmbed;
  users: UserEmbed;
  stock_receive_items: ItemCountEmbed;
};

const RECEIVE_LIST_SELECT =
  "id, reference_number, received_at, notes, received_by, suppliers(name), users!received_by(full_name, email), stock_receive_items(count)" as const;

function embedName (relation: SupplierEmbed): string | null {
  if (!relation) {
    return null;
  }
  const row = Array.isArray(relation) ? relation[0] : relation;
  return row?.name ?? null;
}

function embedReceiverName (relation: UserEmbed): string {
  const row = Array.isArray(relation) ? relation[0] : relation;
  if (!row) {
    return "—";
  }
  return row.full_name?.trim() || row.email || "—";
}

function embedItemCount (relation: ItemCountEmbed | null | undefined): number {
  if (!relation) {
    return 0;
  }
  const row = Array.isArray(relation) ? relation[0] : relation;
  return row?.count ?? 0;
}

function mapListRow (row: StockReceiveListRow): StockReceiveListItem {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    receivedAt: row.received_at,
    supplierName: embedName(row.suppliers),
    itemCount: embedItemCount(row.stock_receive_items),
    receivedByName: embedReceiverName(row.users),
    notes: row.notes,
  };
}

export async function listStockReceives (): Promise<StockReceiveListItem[]> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stock_receives")
    .select(RECEIVE_LIST_SELECT)
    .order("received_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as StockReceiveListRow[]).map(mapListRow);
}
