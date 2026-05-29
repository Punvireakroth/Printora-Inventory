"use server";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { z } from "zod";

const ToggleStaffStatusInputSchema = z.object({
  userId: z.string().uuid(),
  accountStatus: z.enum(["ACTIVE", "INACTIVE"]),
});

export type StaffStatusErrorCode =
  | "invalid_input"
  | "forbidden"
  | "not_found"
  | "cannot_toggle_self"
  | "update_failed";

export type ToggleStaffStatusResult =
  | { ok: true; accountStatus: Database["public"]["Enums"]["active_status"] }
  | { ok: false; code: StaffStatusErrorCode };

export async function toggleStaffStatus (
  input: unknown,
): Promise<ToggleStaffStatusResult> {
  const parsed = ToggleStaffStatusInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const owner = await requireOwnerUser();
  const { userId, accountStatus } = parsed.data;

  if (userId === owner.id) {
    return { ok: false, code: "cannot_toggle_self" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, code: "not_found" };
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ account_status: accountStatus })
    .eq("id", userId);

  if (updateError) {
    return { ok: false, code: "update_failed" };
  }

  return { ok: true, accountStatus };
}
