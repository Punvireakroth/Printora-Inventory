import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseRouteHandlerClient () {
  const { Url, AnonKey } = assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(Url, AnonKey, {
    cookies: {
      getAll () {
        return cookieStore.getAll();
      },
      setAll (
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
