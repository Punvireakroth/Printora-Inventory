import "server-only";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getNextReceiveReference (): Promise<string | null> {
  await requireModuleAccess("stock");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("next_stock_receive_reference");

  if (error || typeof data !== "string") {
    return null;
  }

  return data;
}
