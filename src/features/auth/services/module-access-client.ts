import type { AppModule } from "@/features/auth/constants/app-modules";
import type { CurrentUser } from "@/features/auth/types/current-user";
import { userIsOwner } from "@/features/auth/types/current-user";

export function userCanAccessModule (
  user: Pick<CurrentUser, "role"> | null | undefined,
  module: AppModule,
  allowedModules: readonly AppModule[],
): boolean {
  if (userIsOwner(user)) {
    return true;
  }

  return allowedModules.includes(module);
}
