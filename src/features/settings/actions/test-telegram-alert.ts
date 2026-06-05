"use server";

import { requireOwnerOnly } from "@/features/auth/services/module-access";
import { getSystemSettingsSecrets } from "@/features/settings/services/get-system-settings";
import { getTranslations } from "next-intl/server";

export type TestTelegramAlertErrorCode =
  | "missing_config"
  | "send_failed";

export type TestTelegramAlertResult =
  | { ok: true }
  | { ok: false; code: TestTelegramAlertErrorCode };

export async function testTelegramAlert (): Promise<TestTelegramAlertResult> {
  await requireOwnerOnly();

  const { telegramBotToken, telegramChatId } =
    await getSystemSettingsSecrets();

  if (!telegramBotToken || !telegramChatId) {
    return { ok: false, code: "missing_config" };
  }

  const t = await getTranslations("settings");
  const MessageText = t("testMessageBody");

  const Url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

  try {
    const response = await fetch(Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: MessageText,
      }),
    });

    if (!response.ok) {
      console.error("testTelegramAlert", await response.text());
      return { ok: false, code: "send_failed" };
    }

    const body = (await response.json()) as { ok?: boolean };
    if (!body.ok) {
      return { ok: false, code: "send_failed" };
    }

    return { ok: true };
  } catch (error) {
    console.error("testTelegramAlert", error);
    return { ok: false, code: "send_failed" };
  }
}
