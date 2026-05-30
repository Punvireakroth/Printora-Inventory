"use server";

import { completeSaleRecord } from "@/features/sales/services/complete-sale";
import type { CompleteSaleFailureCode } from "@/features/sales/services/complete-sale";
import { getSaleReceipt } from "@/features/sales/services/get-sale-receipt";
import {
  markSaleTelegramSent,
  sendTelegramSaleAlert,
} from "@/features/sales/services/send-telegram-sale-alert";
import { CompleteSaleSchema } from "@/features/sales/validations/complete-sale-schema";

export type CompleteSaleActionResult =
  | { ok: true; saleId: string }
  | { ok: false; code: CompleteSaleFailureCode | "invalid_input" };

export async function completeSale (
  input: unknown,
): Promise<CompleteSaleActionResult> {
  const parsed = CompleteSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const result = await completeSaleRecord(parsed.data);
  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  // Telegram is non-blocking — sale stays completed if alert fails
  void (async () => {
    const receipt = await getSaleReceipt(result.saleId);
    if (!receipt) {
      return;
    }
    const sent = await sendTelegramSaleAlert(receipt);
    if (sent) {
      await markSaleTelegramSent(result.saleId);
    }
  })();

  return { ok: true, saleId: result.saleId };
}
