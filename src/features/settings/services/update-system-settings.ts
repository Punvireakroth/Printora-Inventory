import "server-only";

import type { UpdateSystemSettingsInput } from "@/features/settings/validations/system-settings-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SETTINGS_ID = 1;

export type UpdateSystemSettingsFailureCode = "update_failed";

export type UpdateSystemSettingsResult =
  | { ok: true }
  | { ok: false; code: UpdateSystemSettingsFailureCode };

function emptyToNull (value: string | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

export async function updateSystemSettingsRecord (
  input: UpdateSystemSettingsInput,
): Promise<UpdateSystemSettingsResult> {
  const supabase = await createSupabaseServerClient();

  const Payload: {
    global_low_stock: number;
    is_telegram_notify: boolean;
    telegram_chat_id?: string | null;
    telegram_bot_token?: string;
  } = {
    global_low_stock: input.globalLowStock,
    is_telegram_notify: input.isTelegramNotify,
  };

  const ChatId = emptyToNull(input.telegramChatId);
  if (ChatId !== null) {
    Payload.telegram_chat_id = ChatId;
  } else if (!input.isTelegramNotify) {
    Payload.telegram_chat_id = null;
  }

  const NewToken = input.telegramBotToken?.trim() ?? "";
  if (NewToken.length > 0) {
    Payload.telegram_bot_token = NewToken;
  }

  const { error } = await supabase
    .from("system_settings")
    .update(Payload)
    .eq("id", SETTINGS_ID);

  if (error) {
    console.error("updateSystemSettingsRecord", error);
    return { ok: false, code: "update_failed" };
  }

  return { ok: true };
}
