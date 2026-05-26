"use server";

import type { CurrentUser } from "@/features/auth/types/current-user";
import { getCurrentUser } from "@/features/auth/services/get-current-user";

/** Client-safe refresh of the signed-in profile (same rules as `getCurrentUser`). */
export async function getCurrentUserAction (): Promise<CurrentUser | null> {
  return getCurrentUser();
}
