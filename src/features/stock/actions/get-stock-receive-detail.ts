"use server";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { getStockReceiveDetail } from "@/features/stock/services/get-stock-receive-detail";
import type { StockReceiveDetail } from "@/features/stock/types/stock-receive";

export async function getStockReceiveDetailAction (
  receiveId: string,
): Promise<StockReceiveDetail | null> {
  await requireOwnerUser();

  if (!receiveId?.trim()) {
    return null;
  }

  return getStockReceiveDetail(receiveId);
}
