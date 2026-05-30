export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "ABA" | "OTHER";

export type PosProductHit = {
  id: string;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  imageUrl: string | null;
  categoryName: string;
  isLowStock: boolean;
};

export type PosCartLine = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
  quantity: number;
  lineDiscount: number;
};

export type PosSettings = {
  allowCashierDiscount: boolean;
};

export type SaleReceipt = {
  id: string;
  receiptNumber: string;
  cashierName: string;
  completedAt: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  localeAtSale: "en" | "km";
  businessName: string | null;
  items: SaleReceiptItem[];
};

export type SaleReceiptItem = {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  lineTotal: number;
};
