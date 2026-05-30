import "server-only";

import type {
  BestSellerChartPoint,
  ProductSalesAggregate,
  ProfitComparisonChartPoint,
  SalesAnalyticsReport,
} from "@/features/reports/types/sales-analytics";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { dateOnlyToEndIso, dateOnlyToStartIso } from "@/lib/date-range";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TOP_PRODUCT_LIMIT = 8;

type SaleItemAnalyticsRow = {
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  line_total: number;
  sales: { status: string; completed_at: string };
};

export type GetSalesAnalyticsFilters = {
  dateFrom?: string;
  dateTo?: string;
};

function truncateLabel (value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function aggregateByProduct (rows: SaleItemAnalyticsRow[]): ProductSalesAggregate[] {
  const byProduct = new Map<string, ProductSalesAggregate>();

  for (const row of rows) {
    const quantity = Number(row.quantity);
    const salesAmount = Number(row.line_total);
    const costAmount = Number(row.cost_price) * quantity;
    const existing = byProduct.get(row.product_id);

    if (existing) {
      existing.quantitySold += quantity;
      existing.salesAmount += salesAmount;
      existing.costAmount += costAmount;
      continue;
    }

    byProduct.set(row.product_id, {
      productId: row.product_id,
      productName: row.product_name_snapshot,
      sku: row.sku_snapshot,
      quantitySold: quantity,
      salesAmount,
      costAmount,
    });
  }

  return Array.from(byProduct.values()).sort(
    (left, right) => right.quantitySold - left.quantitySold,
  );
}

function toBestSellerPoints (
  products: ProductSalesAggregate[],
): BestSellerChartPoint[] {
  return products.slice(0, TOP_PRODUCT_LIMIT).map((product) => ({
    key: product.productId,
    label: truncateLabel(product.productName, 28),
    productName: product.productName,
    quantitySold: product.quantitySold,
    salesAmount: product.salesAmount,
  }));
}

function toProfitComparisonPoints (
  products: ProductSalesAggregate[],
): ProfitComparisonChartPoint[] {
  return products.slice(0, TOP_PRODUCT_LIMIT).map((product) => {
    const unitPrice = product.salesAmount / product.quantitySold;
    const costPrice = product.costAmount / product.quantitySold;

    return {
      key: product.productId,
      label: truncateLabel(product.productName, 18),
      productName: product.productName,
      unitPrice,
      costPrice,
      profitPerUnit: unitPrice - costPrice,
    };
  });
}

export async function getSalesAnalytics (
  filters: GetSalesAnalyticsFilters = {},
): Promise<SalesAnalyticsReport> {
  await requireOwnerUser();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("sale_items")
    .select(
      "product_id, product_name_snapshot, sku_snapshot, quantity, unit_price, cost_price, line_total, sales!inner(status, completed_at)",
    )
    .eq("sales.status", "COMPLETED");

  if (filters.dateFrom) {
    query = query.gte("sales.completed_at", dateOnlyToStartIso(filters.dateFrom));
  }

  if (filters.dateTo) {
    query = query.lte("sales.completed_at", dateOnlyToEndIso(filters.dateTo));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getSalesAnalytics]", error);
    return {
      summary: {
        quantitySold: 0,
        salesAmount: 0,
        costAmount: 0,
        profitAmount: 0,
        marginPercent: null,
      },
      bestSellers: [],
      profitComparison: [],
    };
  }

  const rows = (data ?? []) as unknown as SaleItemAnalyticsRow[];
  const products = aggregateByProduct(rows);

  const quantitySold = products.reduce(
    (total, product) => total + product.quantitySold,
    0,
  );
  const salesAmount = products.reduce(
    (total, product) => total + product.salesAmount,
    0,
  );
  const costAmount = products.reduce(
    (total, product) => total + product.costAmount,
    0,
  );
  const profitAmount = salesAmount - costAmount;
  const marginPercent =
    salesAmount > 0 ? (profitAmount / salesAmount) * 100 : null;

  return {
    summary: {
      quantitySold,
      salesAmount,
      costAmount,
      profitAmount,
      marginPercent,
    },
    bestSellers: toBestSellerPoints(products),
    profitComparison: toProfitComparisonPoints(products),
  };
}
