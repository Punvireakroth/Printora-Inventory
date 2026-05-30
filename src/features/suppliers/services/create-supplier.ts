import "server-only";

import type { CreateSupplierInput } from "@/features/suppliers/validations/supplier-schema";
import { emptyToNull } from "@/features/suppliers/lib/field-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateSupplierFailureCode = "insert_failed";

export type CreateSupplierResult =
  | { ok: true; supplierId: string }
  | { ok: false; code: CreateSupplierFailureCode };

export async function createSupplierRecord (
  input: CreateSupplierInput,
): Promise<CreateSupplierResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: input.name.trim(),
      phone: emptyToNull(input.phone),
      address: emptyToNull(input.address),
      email: emptyToNull(input.email),
      notes: emptyToNull(input.notes),
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (error) {
    console.error("createSupplierRecord", error);
    return { ok: false, code: "insert_failed" };
  }

  return { ok: true, supplierId: data.id };
}
