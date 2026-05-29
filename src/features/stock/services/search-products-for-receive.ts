import "server-only";

import type { ProductReceiveSearchHit } from "@/features/stock/types/stock-receive";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function sanitizeIlikeQuery (query: string): string {
  return query.replace(/[%_,()]/g, " ").trim();
}

export async function searchProductsForReceive (
  query: string,
  limit = 20,
): Promise<ProductReceiveSearchHit[]> {
  await requireOwnerUser();

  const trimmed = sanitizeIlikeQuery(query);
  if (!trimmed) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const pattern = `%${trimmed}%`;
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, current_stock, cost_price")
    .eq("status", "ACTIVE")
    .or(`name.ilike.${pattern},sku.ilike.${pattern}`)
    .order("name", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    currentStock: row.current_stock,
    costPrice: Number(row.cost_price),
  }));
}
