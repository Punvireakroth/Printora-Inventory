import "server-only";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import type { SystemSettingsFormInitial } from "@/features/settings/types/system-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SETTINGS_ID = 1;

export async function getSystemSettings (): Promise<SystemSettingsFormInitial> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select(
      "global_low_stock, telegram_bot_token, telegram_chat_id, is_telegram_notify",
    )
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error || !data) {
    return {
      globalLowStock: 5,
      isTelegramNotify: false,
      hasTelegramToken: false,
      telegramChatId: null,
    };
  }

  const Token = data.telegram_bot_token?.trim() ?? "";

  return {
    globalLowStock: data.global_low_stock,
    isTelegramNotify: data.is_telegram_notify,
    hasTelegramToken: Token.length > 0,
    telegramChatId: data.telegram_chat_id,
  };
}

export async function getSystemSettingsSecrets (): Promise<{
  telegramBotToken: string | null;
  telegramChatId: string | null;
}> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("telegram_bot_token, telegram_chat_id")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error || !data) {
    return { telegramBotToken: null, telegramChatId: null };
  }

  const Token = data.telegram_bot_token?.trim() ?? "";

  return {
    telegramBotToken: Token.length > 0 ? Token : null,
    telegramChatId: data.telegram_chat_id?.trim() || null,
  };
}
