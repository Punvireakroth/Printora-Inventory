import type { Database } from "@/types/database";

export type UserRole = Database["public"]["Tables"]["users"]["Row"]["role"];
export type AccountStatus =
  Database["public"]["Tables"]["users"]["Row"]["account_status"];
export type UserLocale =
  Database["public"]["Tables"]["users"]["Row"]["preferred_locale"];

/** Authenticated app user (`auth.users` + `public.users` profile). */
export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  preferredLocale: UserLocale;
};

export function userIsOwner (
  user: Pick<CurrentUser, "role"> | null | undefined,
): boolean {
  return user?.role === "OWNER";
}

export function userIsCashier (
  user: Pick<CurrentUser, "role"> | null | undefined,
): boolean {
  return user?.role === "CASHIER";
}

export function userIsActive (
  user: Pick<CurrentUser, "accountStatus"> | null | undefined,
): boolean {
  return user?.accountStatus === "ACTIVE";
}
