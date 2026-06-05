import "server-only";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import type { SupplierListItem } from "@/features/suppliers/types/supplier";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listSuppliers (): Promise<SupplierListItem[]> {
  await requireModuleAccess("suppliers");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, phone, email, address, notes, status")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    status: row.status,
  }));
}
