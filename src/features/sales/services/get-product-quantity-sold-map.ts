import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type ProductQuantitySoldRow = {
  product_id: string;
  quantity_sold: number;
};

export async function getProductQuantitySoldMap (
  supabase: SupabaseClient,
): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc("get_product_quantity_sold_map");

  if (error || !data) {
    console.error("[getProductQuantitySoldMap]", error);
    return new Map();
  }

  const quantitySoldByProductId = new Map<string, number>();

  for (const row of data as ProductQuantitySoldRow[]) {
    quantitySoldByProductId.set(row.product_id, Number(row.quantity_sold));
  }

  return quantitySoldByProductId;
}
