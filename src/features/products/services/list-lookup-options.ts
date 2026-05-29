import "server-only";

import type { LookupOption } from "@/features/products/types/product";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listCategoryOptions (): Promise<LookupOption[]> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("status", "ACTIVE")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({ id: row.id, name: row.name }));
}

export async function listSupplierOptions (): Promise<LookupOption[]> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("status", "ACTIVE")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({ id: row.id, name: row.name }));
}
