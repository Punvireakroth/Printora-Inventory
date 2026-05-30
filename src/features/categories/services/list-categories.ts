import "server-only";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import type { CategoryListItem } from "@/features/categories/types/category";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listCategories (): Promise<CategoryListItem[]> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description, sort_order, status")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    status: row.status,
  }));
}
