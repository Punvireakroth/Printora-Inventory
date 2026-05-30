export type StockMovementType = "STOCK_IN" | "SALE" | "ADJUSTMENT" | "REFUND";

export type StockMovementListItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  movementType: StockMovementType;
  quantityDelta: number;
  oldStock: number;
  newStock: number;
  createdAt: string;
  createdByName: string;
  notes: string | null;
};
