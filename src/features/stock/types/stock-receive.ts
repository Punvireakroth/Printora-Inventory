export type ProductReceiveSearchHit = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  costPrice: number;
};

export type StockReceiveLineDraft = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  currentStock: number;
};
