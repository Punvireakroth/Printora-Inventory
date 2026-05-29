import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  assertSupabaseServiceRoleEnv,
  getSupabaseProjectUrl,
} from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient () {
  const { ServiceRoleKey } = assertSupabaseServiceRoleEnv();
  const Url = getSupabaseProjectUrl();

  if (!Url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  return createClient<Database>(Url, ServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
