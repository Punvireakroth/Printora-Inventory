import "server-only";

import type { PosSettings } from "@/features/sales/types/pos";
import { requireCurrentUser } from "@/features/auth/services/get-current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPosSettings (): Promise<PosSettings> {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("allow_cashier_discount")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { allowCashierDiscount: false };
  }

  return { allowCashierDiscount: data.allow_cashier_discount };
}
