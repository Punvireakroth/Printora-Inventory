import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DeleteStaffUserFailureCode =
  | "not_found"
  | "cannot_delete_owner"
  | "auth_delete_failed"
  | "service_role_unconfigured";

export type DeleteStaffUserResult =
  | { ok: true }
  | { ok: false; code: DeleteStaffUserFailureCode };

export async function deleteStaffUser (
  userId: string,
): Promise<DeleteStaffUserResult> {
  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return { ok: false, code: "service_role_unconfigured" };
  }

  const { data: profile, error: fetchError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError || !profile) {
    return { ok: false, code: "not_found" };
  }

  if (profile.role === "OWNER") {
    return { ok: false, code: "cannot_delete_owner" };
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

  if (deleteError) {
    return { ok: false, code: "auth_delete_failed" };
  }

  return { ok: true };
}
