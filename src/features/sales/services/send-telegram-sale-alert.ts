import "server-only";

import type { SaleReceipt } from "@/features/sales/types/pos";
import { BUSINESS_TIME_ZONE } from "@/lib/business-date";
import { getPublicSiteOrigin } from "@/lib/site-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

type TelegramSettings = {
  botToken: string | null;
  chatId: string | null;
  isNotify: boolean;
};

const PAYMENT_QR_FILE_NAME = "QR-Code.png";

async function getTelegramSettings (): Promise<TelegramSettings> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("system_settings")
      .select("telegram_bot_token, telegram_chat_id, is_telegram_notify")
      .eq("id", 1)
      .maybeSingle();

    return {
      botToken: data?.telegram_bot_token ?? process.env.TELEGRAM_BOT_TOKEN ?? null,
      chatId: data?.telegram_chat_id ?? process.env.TELEGRAM_CHAT_ID ?? null,
      isNotify: data?.is_telegram_notify ?? false,
    };
  } catch {
    return {
      botToken: process.env.TELEGRAM_BOT_TOKEN ?? null,
      chatId: process.env.TELEGRAM_CHAT_ID ?? null,
      isNotify: Boolean(
        process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
      ),
    };
  }
}

function formatCurrency (amount: number, locale: "en" | "km"): string {
  return new Intl.NumberFormat(locale === "km" ? "km-KH" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDateTime (iso: string, locale: "en" | "km"): string {
  return new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date(iso));
}

function buildSaleAlertMessage (
  receipt: SaleReceipt,
  t: Awaited<ReturnType<typeof getTranslations<"telegram.saleAlert">>>,
): string {
  return [
    t("title"),
    "",
    t("receiptNumber", { number: receipt.receiptNumber }),
    t("cashier", { name: receipt.cashierName }),
    t("total", {
      amount: formatCurrency(receipt.total, receipt.localeAtSale),
    }),
    t("paymentMethod", {
      method: t(`payment.${receipt.paymentMethod}`),
    }),
    t("date", {
      datetime: formatDateTime(receipt.completedAt, receipt.localeAtSale),
    }),
  ].join("\n");
}

async function readPaymentQrImage (): Promise<Buffer | null> {
  const ImagePath = path.join(process.cwd(), "public", PAYMENT_QR_FILE_NAME);

  try {
    return await readFile(ImagePath);
  } catch (error) {
    console.error("[telegram] QR image read failed", error);
    return null;
  }
}

async function telegramRequest (
  botToken: string,
  method: string,
  init: RequestInit,
): Promise<{ ok: boolean; body: string }> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/${method}`,
    init,
  );
  const body = await response.text();

  return {
    ok: response.ok,
    body,
  };
}

async function sendTelegramTextMessage (
  botToken: string,
  chatId: string,
  text: string,
): Promise<boolean> {
  const result = await telegramRequest(botToken, "sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!result.ok) {
    console.error("[telegram] sendMessage failed", result.body);
    return false;
  }

  return true;
}

async function sendTelegramPhotoUpload (
  botToken: string,
  chatId: string,
  caption: string,
  imageBuffer: Buffer,
): Promise<boolean> {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption);
  form.append(
    "photo",
    new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }),
    PAYMENT_QR_FILE_NAME,
  );

  const result = await telegramRequest(botToken, "sendPhoto", {
    method: "POST",
    body: form,
  });

  if (!result.ok) {
    console.error("[telegram] sendPhoto upload failed", result.body);
    return false;
  }

  return true;
}

async function sendTelegramPhotoByUrl (
  botToken: string,
  chatId: string,
  caption: string,
  photoUrl: string,
): Promise<boolean> {
  const result = await telegramRequest(botToken, "sendPhoto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
    }),
  });

  if (!result.ok) {
    console.error("[telegram] sendPhoto url failed", result.body);
    return false;
  }

  return true;
}

async function sendTelegramSaleAlertWithPhoto (
  botToken: string,
  chatId: string,
  caption: string,
): Promise<boolean> {
  const imageBuffer = await readPaymentQrImage();

  if (imageBuffer) {
    const uploaded = await sendTelegramPhotoUpload(
      botToken,
      chatId,
      caption,
      imageBuffer,
    );
    if (uploaded) {
      return true;
    }
  }

  const photoUrl = `${getPublicSiteOrigin()}/${PAYMENT_QR_FILE_NAME}`;
  if (photoUrl.startsWith("https://")) {
    const sentByUrl = await sendTelegramPhotoByUrl(
      botToken,
      chatId,
      caption,
      photoUrl,
    );
    if (sentByUrl) {
      return true;
    }
  }

  return sendTelegramTextMessage(botToken, chatId, caption);
}

export async function sendTelegramSaleAlert (
  receipt: SaleReceipt,
): Promise<boolean> {
  const settings = await getTelegramSettings();
  if (!settings.isNotify || !settings.botToken || !settings.chatId) {
    return false;
  }

  const t = await getTranslations({
    locale: receipt.localeAtSale,
    namespace: "telegram.saleAlert",
  });

  const message = buildSaleAlertMessage(receipt, t);

  try {
    return await sendTelegramSaleAlertWithPhoto(
      settings.botToken,
      settings.chatId,
      message,
    );
  } catch (error) {
    console.error("[telegram] send error", error);
    return false;
  }
}

export async function markSaleTelegramSent (saleId: string): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin
      .from("sales")
      .update({ telegram_sent: true })
      .eq("id", saleId);
  } catch (error) {
    console.error("[telegram] mark sent failed", error);
  }
}
