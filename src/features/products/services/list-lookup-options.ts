import "server-only";

import type { LookupOption } from "@/features/products/types/product";
import { requireModuleAccess } from "@/features/auth/services/module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listCategoryOptions (): Promise<LookupOption[]> {
  await requireModuleAccess("products");

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
  await requireModuleAccess("products");

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
