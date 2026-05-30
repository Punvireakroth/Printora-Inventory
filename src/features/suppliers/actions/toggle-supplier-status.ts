"use server";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { z } from "zod";

const ToggleSupplierStatusInputSchema = z.object({
  supplierId: z.string().uuid(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type ToggleSupplierStatusErrorCode =
  | "invalid_input"
  | "not_found"
  | "update_failed";

export type ToggleSupplierStatusResult =
  | { ok: true; status: Database["public"]["Enums"]["active_status"] }
  | { ok: false; code: ToggleSupplierStatusErrorCode };

export async function toggleSupplierStatus (
  input: unknown,
): Promise<ToggleSupplierStatusResult> {
  await requireOwnerUser();

  const parsed = ToggleSupplierStatusInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const { supplierId, status } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("suppliers")
    .select("id")
    .eq("id", supplierId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, code: "not_found" };
  }

  const { error: updateError } = await supabase
    .from("suppliers")
    .update({ status })
    .eq("id", supplierId);

  if (updateError) {
    return { ok: false, code: "update_failed" };
  }

  return { ok: true, status };
}
