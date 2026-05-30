import type { PaymentMethod } from "@/features/sales/types/pos";

export type DashboardStats = {
  todaySalesAmount: number;
  todaySalesCount: number;
  monthSalesAmount: number;
  totalProducts: number;
  lowStockCount: number;
};

export type DashboardRecentSale = {
  id: string;
  receiptNumber: string;
  cashierName: string;
  total: number;
  paymentMethod: PaymentMethod;
  completedAt: string;
};

export type DashboardLowStockProduct = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  sellingPrice: number;
};
