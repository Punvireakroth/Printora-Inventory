"use client";

import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv } from "@/lib/supabase/env";

let browserClientSingleton: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Singleton browser client — session lives in chunked cookies refreshed by middleware.
 */
export function createSupabaseBrowserClient () {
  if (!browserClientSingleton) {
    const { Url, AnonKey } = assertSupabaseEnv();
    browserClientSingleton = createBrowserClient(Url, AnonKey, {
      isSingleton: true,
    });
  }
  return browserClientSingleton;
}
