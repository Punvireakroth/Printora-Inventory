import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient () {
  const { Url, AnonKey } = assertSupabaseEnv();

  const cookieStore = await cookies();

  return createServerClient(Url, AnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — cookie writes run from middleware / Route Handlers only.
        }
      },
    },
  });
}
