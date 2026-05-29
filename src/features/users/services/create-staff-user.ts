import "server-only";

import type { CreateStaffInput } from "@/features/users/validations/create-staff-schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CreateStaffUserFailureCode =
  | "email_taken"
  | "auth_create_failed"
  | "profile_sync_failed"
  | "service_role_unconfigured";

export type CreateStaffUserResult =
  | { ok: true; userId: string }
  | { ok: false; code: CreateStaffUserFailureCode };

function normalizeEmail (email: string): string {
  return email.trim().toLowerCase();
}

async function findUserIdByEmail (email: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.id ?? null;
}

async function syncCashierProfile (
  userId: string,
  input: CreateStaffInput,
  email: string,
): Promise<CreateStaffUserResult> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("users")
    .update({
      email,
      full_name: input.fullName.trim(),
      role: "CASHIER",
      account_status: "ACTIVE",
    })
    .eq("id", userId);

  if (error) {
    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      email,
      full_name: input.fullName.trim(),
      role: "CASHIER",
      account_status: "ACTIVE",
    });

    if (insertError) {
      return { ok: false, code: "profile_sync_failed" };
    }
  }

  return { ok: true, userId };
}

export async function createStaffUser (
  input: CreateStaffInput,
): Promise<CreateStaffUserResult> {
  const email = normalizeEmail(input.email);

  const existingId = await findUserIdByEmail(email);
  if (existingId) {
    return { ok: false, code: "email_taken" };
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return { ok: false, code: "service_role_unconfigured" };
  }

  const { data, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: input.tempPassword,
    email_confirm: true,
  });

  if (createError || !data.user) {
    const message = createError?.message?.toLowerCase() ?? "";
    if (
      message.includes("already")
      || message.includes("registered")
      || message.includes("exists")
    ) {
      return { ok: false, code: "email_taken" };
    }
    return { ok: false, code: "auth_create_failed" };
  }

  await new Promise((resolve) => setTimeout(resolve, 400));

  return syncCashierProfile(data.user.id, input, email);
}
