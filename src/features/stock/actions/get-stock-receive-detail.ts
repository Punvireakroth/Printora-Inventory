"use server";

import { requireModuleAccess } from "@/features/auth/services/module-access";
import { getStockReceiveDetail } from "@/features/stock/services/get-stock-receive-detail";
import type { StockReceiveDetail } from "@/features/stock/types/stock-receive";

export async function getStockReceiveDetailAction (
  receiveId: string,
): Promise<StockReceiveDetail | null> {
  await requireModuleAccess("stock");

  if (!receiveId?.trim()) {
    return null;
  }

  return getStockReceiveDetail(receiveId);
}
