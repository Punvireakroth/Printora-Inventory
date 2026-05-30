import type { PaymentMethod } from "@/features/sales/types/pos";

export type SaleStatus = "COMPLETED" | "CANCELLED" | "REFUNDED";

export type SaleListItem = {
  id: string;
  receiptNumber: string;
  completedAt: string;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
};

export type OwnerSaleListItem = SaleListItem & {
  cashierName: string;
};
