import "server-only";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import type { SupplierListItem } from "@/features/suppliers/types/supplier";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listSuppliers (): Promise<SupplierListItem[]> {
  await requireOwnerUser();

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
