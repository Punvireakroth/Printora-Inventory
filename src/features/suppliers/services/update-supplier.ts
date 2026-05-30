import "server-only";

import type { UpdateSupplierInput } from "@/features/suppliers/validations/supplier-schema";
import { emptyToNull } from "@/features/suppliers/lib/field-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateSupplierFailureCode = "not_found" | "update_failed";

export type UpdateSupplierResult =
  | { ok: true }
  | { ok: false; code: UpdateSupplierFailureCode };

export async function updateSupplierRecord (
  input: UpdateSupplierInput,
): Promise<UpdateSupplierResult> {
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("suppliers")
    .select("id")
    .eq("id", input.supplierId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, code: "not_found" };
  }

  const { error } = await supabase
    .from("suppliers")
    .update({
      name: input.name.trim(),
      phone: emptyToNull(input.phone),
      address: emptyToNull(input.address),
      email: emptyToNull(input.email),
      notes: emptyToNull(input.notes),
    })
    .eq("id", input.supplierId);

  if (error) {
    console.error("updateSupplierRecord", error);
    return { ok: false, code: "update_failed" };
  }

  return { ok: true };
}
