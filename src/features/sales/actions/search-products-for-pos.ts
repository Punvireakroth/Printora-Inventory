"use server";

import { searchProductsForPos } from "@/features/sales/services/search-products-for-pos";
import type { PosProductHit } from "@/features/sales/types/pos";

export async function searchProductsForPosAction (
  query: string,
): Promise<PosProductHit[]> {
  return searchProductsForPos(query);
}
