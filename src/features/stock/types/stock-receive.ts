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

export type StockReceiveListItem = {
  id: string;
  referenceNumber: string | null;
  receivedAt: string;
  supplierName: string | null;
  itemCount: number;
  receivedByName: string;
  notes: string | null;
};

export type StockReceiveDetailLine = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
};

export type StockReceiveDetail = {
  id: string;
  referenceNumber: string | null;
  receivedAt: string;
  supplierName: string | null;
  receivedByName: string;
  notes: string | null;
  lines: StockReceiveDetailLine[];
  totalUnits: number;
  totalCost: number;
};
