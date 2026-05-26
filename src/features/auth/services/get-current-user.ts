import "server-only";

import type { CurrentUser } from "@/features/auth/types/current-user";
import { userIsActive, userIsOwner } from "@/features/auth/types/current-user";
import { redirect } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { getLocale } from "next-intl/server";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

const USER_PROFILE_SELECT =
  "id, email, full_name, role, account_status, preferred_locale" as const;

type UserProfileRow = Pick<
  UserRow,
  "id" | "email" | "full_name" | "role" | "account_status" | "preferred_locale"
>;

function mapUserRow (row: UserProfileRow): CurrentUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    accountStatus: row.account_status,
    preferredLocale: row.preferred_locale,
  };
}

/** Verified session + `public.users` profile, or `null` when signed out / inactive / missing profile. */
export async function getCurrentUser (): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(USER_PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const mapped = mapUserRow(profile);
  if (!userIsActive(mapped)) {
    return null;
  }

  return mapped;
}

/** Like `getCurrentUser` but redirects to login when unauthenticated. */
export async function requireCurrentUser (): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale: await getLocale() });
    throw new Error("Unreachable");
  }
  return user;
}

/** Owner-only server entry points (pages, actions). Cashiers go to POS. */
export async function requireOwnerUser (): Promise<CurrentUser> {
  const user = await requireCurrentUser();
  if (!userIsOwner(user)) {
    redirect({ href: "/pos", locale: await getLocale() });
    throw new Error("Unreachable");
  }
  return user;
}
