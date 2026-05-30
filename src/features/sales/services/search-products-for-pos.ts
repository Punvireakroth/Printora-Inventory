import "server-only";

import {
  mapPosProductRows,
  POS_PRODUCT_SELECT,
  type PosProductRow,
} from "@/features/sales/lib/map-pos-product";
import type { PosProductHit } from "@/features/sales/types/pos";
import { requireCurrentUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function sanitizeIlikeQuery (query: string): string {
  return query.replace(/[%_,()]/g, " ").trim();
}

export async function searchProductsForPos (
  query: string,
  limit = 48,
): Promise<PosProductHit[]> {
  await requireCurrentUser();

  const trimmed = sanitizeIlikeQuery(query);
  if (trimmed.length < 2) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const pattern = `%${trimmed}%`;

  const { data: matchingCategories } = await supabase
    .from("categories")
    .select("id")
    .eq("status", "ACTIVE")
    .ilike("name", pattern);

  const categoryIds = (matchingCategories ?? []).map((row) => row.id);
  const orFilters = [
    `name.ilike.${pattern}`,
    `sku.ilike.${pattern}`,
    `size.ilike.${pattern}`,
    `color.ilike.${pattern}`,
  ];

  if (categoryIds.length > 0) {
    orFilters.push(`category_id.in.(${categoryIds.join(",")})`);
  }

  const { data, error } = await supabase
    .from("products")
    .select(POS_PRODUCT_SELECT)
    .eq("status", "ACTIVE")
    .or(orFilters.join(","))
    .order("name", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return mapPosProductRows(supabase, data as unknown as PosProductRow[]);
}
