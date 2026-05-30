export type ProductSalesAggregate = {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  salesAmount: number;
  costAmount: number;
};

export type SalesAnalyticsSummary = {
  quantitySold: number;
  salesAmount: number;
  costAmount: number;
  profitAmount: number;
  marginPercent: number | null;
};

export type BestSellerChartPoint = {
  key: string;
  label: string;
  productName: string;
  quantitySold: number;
  salesAmount: number;
};

export type ProfitComparisonChartPoint = {
  key: string;
  label: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  profitPerUnit: number;
};

export type SalesAnalyticsReport = {
  summary: SalesAnalyticsSummary;
  bestSellers: BestSellerChartPoint[];
  profitComparison: ProfitComparisonChartPoint[];
};
