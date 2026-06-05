"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { z } from "zod";

const ToggleCategoryStatusInputSchema = z.object({
  categoryId: z.string().uuid(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type ToggleCategoryStatusErrorCode =
  | "invalid_input"
  | "not_found"
  | "update_failed";

export type ToggleCategoryStatusResult =
  | { ok: true; status: Database["public"]["Enums"]["active_status"] }
  | { ok: false; code: ToggleCategoryStatusErrorCode };

export async function toggleCategoryStatus (
  input: unknown,
): Promise<ToggleCategoryStatusResult> {
  await requireModuleAccess("categories");

  const parsed = ToggleCategoryStatusInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const { categoryId, status } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, code: "not_found" };
  }

  const { error: updateError } = await supabase
    .from("categories")
    .update({ status })
    .eq("id", categoryId);

  if (updateError) {
    return { ok: false, code: "update_failed" };
  }

  return { ok: true, status };
}
