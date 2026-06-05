import "server-only";

import {
  DEFAULT_CASHIER_MODULES,
  type AppModule,
  isAppModule,
  normalizeCashierModules,
  resolveModuleForRestPath,
} from "@/features/auth/constants/app-modules";
import { userCanAccessModule } from "@/features/auth/services/module-access-client";
import type { CurrentUser } from "@/features/auth/types/current-user";
import { userIsOwner } from "@/features/auth/types/current-user";

export { userCanAccessModule } from "@/features/auth/services/module-access-client";
import { redirect } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { requireCurrentUser } from "@/features/auth/services/get-current-user";

const SETTINGS_ID = 1;

export async function getCashierAllowedModules (): Promise<AppModule[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("cashier_allowed_modules")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error || !data?.cashier_allowed_modules) {
    return [...DEFAULT_CASHIER_MODULES];
  }

  return normalizeCashierModules(data.cashier_allowed_modules);
}

export function userCanAccessRestPath (
  user: Pick<CurrentUser, "role"> | null | undefined,
  restPath: string,
  allowedModules: readonly AppModule[],
): boolean {
  if (userIsOwner(user)) {
    return true;
  }

  const resolved = resolveModuleForRestPath(restPath);

  if (resolved === "owner_only") {
    return false;
  }

  if (resolved === null) {
    return true;
  }

  return allowedModules.includes(resolved);
}

export async function requireModuleAccess (
  module: AppModule,
): Promise<CurrentUser> {
  const user = await requireCurrentUser();

  if (userIsOwner(user)) {
    return user;
  }

  const allowedModules = await getCashierAllowedModules();
  if (!userCanAccessModule(user, module, allowedModules)) {
    redirect({ href: "/pos", locale: await getLocale() });
    throw new Error("Unreachable");
  }

  return user;
}

/** Settings and staff management — never grantable to cashiers. */
export async function requireOwnerOnly (): Promise<CurrentUser> {
  const user = await requireCurrentUser();

  if (!userIsOwner(user)) {
    redirect({ href: "/pos", locale: await getLocale() });
    throw new Error("Unreachable");
  }

  return user;
}

export function parseAllowedModulesInput (
  modules: unknown,
): AppModule[] | null {
  if (!Array.isArray(modules)) {
    return null;
  }

  const filtered = modules.filter(
    (value): value is AppModule =>
      typeof value === "string" && isAppModule(value),
  );

  return normalizeCashierModules(filtered);
}
