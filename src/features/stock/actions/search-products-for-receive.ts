"use server";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { searchProductsForReceive } from "@/features/stock/services/search-products-for-receive";
import type { ProductReceiveSearchHit } from "@/features/stock/types/stock-receive";

export async function searchProductsForReceiveAction (
  query: string,
): Promise<ProductReceiveSearchHit[]> {
  await requireOwnerUser();
  return searchProductsForReceive(query);
}
