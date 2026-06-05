import "server-only";

import type { StockReceiveDetail } from "@/features/stock/types/stock-receive";
import { requireModuleAccess } from "@/features/auth/services/module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupplierEmbed = { name: string } | { name: string }[] | null;
type UserEmbed = {
  full_name: string | null;
  email: string;
} | {
  full_name: string | null;
  email: string;
}[] | null;

type ProductEmbed = {
  id: string;
  name: string;
  sku: string;
} | {
  id: string;
  name: string;
  sku: string;
}[] | null;

type ReceiveItemRow = {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  products: ProductEmbed;
};

type StockReceiveDetailRow = {
  id: string;
  reference_number: string | null;
  received_at: string;
  notes: string | null;
  suppliers: SupplierEmbed;
  users: UserEmbed;
  stock_receive_items: ReceiveItemRow[] | null;
};

const RECEIVE_DETAIL_SELECT =
  "id, reference_number, received_at, notes, suppliers(name), users!received_by(full_name, email), stock_receive_items(id, product_id, quantity, unit_cost, products(id, name, sku))" as const;

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

function embedProduct (relation: ProductEmbed): { id: string; name: string; sku: string } | null {
  if (!relation) {
    return null;
  }
  const row = Array.isArray(relation) ? relation[0] : relation;
  return row ?? null;
}

export async function getStockReceiveDetail (
  receiveId: string,
): Promise<StockReceiveDetail | null> {
  await requireModuleAccess("stock");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stock_receives")
    .select(RECEIVE_DETAIL_SELECT)
    .eq("id", receiveId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as StockReceiveDetailRow;
  const items = row.stock_receive_items ?? [];

  const lines = items.map((item) => {
    const product = embedProduct(item.products);
    const unitCost = Number(item.unit_cost);
    const quantity = item.quantity;
    return {
      id: item.id,
      productId: item.product_id,
      productName: product?.name ?? "—",
      sku: product?.sku ?? "—",
      quantity,
      unitCost,
      lineTotal: quantity * unitCost,
    };
  });

  const totalUnits = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalCost = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return {
    id: row.id,
    referenceNumber: row.reference_number,
    receivedAt: row.received_at,
    supplierName: embedName(row.suppliers),
    receivedByName: embedReceiverName(row.users),
    notes: row.notes,
    lines,
    totalUnits,
    totalCost,
  };
}
