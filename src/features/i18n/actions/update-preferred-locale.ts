"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const LocaleSchema = z.enum(["en", "km"]);

export type UpdatePreferredLocaleResult =
  | { ok: true }
  | { ok: false; code: "locale_invalid" | "locale_save_failed" };

export async function updatePreferredLocale(
  locale: unknown,
): Promise<UpdatePreferredLocaleResult> {
  const parsed = LocaleSchema.safeParse(locale);
  if (!parsed.success) {
    return { ok: false, code: "locale_invalid" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("users")
    .update({ preferred_locale: parsed.data })
    .eq("id", user.id);

  if (error) {
    return { ok: false, code: "locale_save_failed" };
  }

  return { ok: true };
}
