"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { searchProductsForReceive } from "@/features/stock/services/search-products-for-receive";
import type { ProductReceiveSearchHit } from "@/features/stock/types/stock-receive";

export async function searchProductsForReceiveAction (
  query: string,
): Promise<ProductReceiveSearchHit[]> {
  await requireModuleAccess("stock");
  return searchProductsForReceive(query);
}
