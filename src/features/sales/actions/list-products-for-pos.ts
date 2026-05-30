"use server";

import {
  listProductsForPos,
  type ListProductsForPosFilters,
  type ListProductsForPosResult,
} from "@/features/sales/services/list-products-for-pos";

export async function listProductsForPosAction (
  filters: ListProductsForPosFilters = {},
): Promise<ListProductsForPosResult> {
  return listProductsForPos(filters);
}
