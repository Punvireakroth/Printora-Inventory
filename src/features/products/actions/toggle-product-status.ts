"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { z } from "zod";

const ToggleProductStatusInputSchema = z.object({
  productId: z.string().uuid(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type ToggleProductStatusErrorCode =
  | "invalid_input"
  | "not_found"
  | "update_failed";

export type ToggleProductStatusResult =
  | { ok: true; status: Database["public"]["Enums"]["active_status"] }
  | { ok: false; code: ToggleProductStatusErrorCode };

export async function toggleProductStatus (
  input: unknown,
): Promise<ToggleProductStatusResult> {
  await requireModuleAccess("products");

  const parsed = ToggleProductStatusInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const { productId, status } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, code: "not_found" };
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({ status })
    .eq("id", productId);

  if (updateError) {
    return { ok: false, code: "update_failed" };
  }

  return { ok: true, status };
}
