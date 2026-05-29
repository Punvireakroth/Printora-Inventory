import "server-only";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getNextReceiveReference (): Promise<string | null> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("next_stock_receive_reference");

  if (error || typeof data !== "string") {
    return null;
  }

  return data;
}
