import type { CategoryListItem } from "@/features/categories/types/category";
import type { ProductListItem } from "@/features/products/types/product";
import type {
  OwnerSaleListItem,
  SaleListItem,
} from "@/features/sales/types/sale-list-item";
import type { StockMovementListItem } from "@/features/stock/types/stock-movement";
import type {
  StockReceiveListItem,
} from "@/features/stock/types/stock-receive";
import type { SupplierListItem } from "@/features/suppliers/types/supplier";
import type { StaffUserListItem } from "@/features/users/types/staff-user";
import type { ExportColumn } from "@/lib/export/excel";
import { formatCurrency } from "@/lib/utils";
import type { useFormatter, useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations>;
type Formatter = ReturnType<typeof useFormatter>;

function displayDash (value: string | null | undefined): string {
  return value?.trim() ? value : "—";
}

function formatDateTime (
  format: Formatter,
  value: string,
  withTime = true,
): string {
  return format.dateTime(new Date(value), {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  });
}

function formatQuantityDelta (
  delta: number,
  format: Formatter,
): string {
  if (delta > 0) {
    return `+${format.number(delta)}`;
  }
  return format.number(delta);
}

export function buildProductsExportColumns (
  t: Translator,
  format: Formatter,
  showCostPrice: boolean,
): ExportColumn<ProductListItem>[] {
  const columns: ExportColumn<ProductListItem>[] = [
    {
      header: t("columns.name"),
      value: (row) => row.name,
    },
    {
      header: t("columns.sku"),
      value: (row) => row.sku,
    },
    {
      header: t("columns.category"),
      value: (row) => row.categoryName,
    },
    {
      header: t("columns.size"),
      value: (row) => displayDash(row.size),
    },
    {
      header: t("columns.color"),
      value: (row) => displayDash(row.color),
    },
  ];

  if (showCostPrice) {
    columns.push({
      header: t("columns.cost"),
      value: (row) => formatCurrency(row.costPrice),
    });
  }

  columns.push(
    {
      header: t("columns.price"),
      value: (row) => formatCurrency(row.sellingPrice),
    },
    {
      header: t("columns.stock"),
      value: (row) => row.currentStock,
    },
    {
      header: t("columns.status"),
      value: (row) => t(`status.${row.status}`),
    },
  );

  return columns;
}

export function buildCategoriesExportColumns (
  t: Translator,
): ExportColumn<CategoryListItem>[] {
  return [
    {
      header: t("columns.name"),
      value: (row) => row.name,
    },
    {
      header: t("columns.description"),
      value: (row) => displayDash(row.description),
    },
    {
      header: t("columns.status"),
      value: (row) => t(`status.${row.status}`),
    },
  ];
}

export function buildSuppliersExportColumns (
  t: Translator,
): ExportColumn<SupplierListItem>[] {
  return [
    {
      header: t("columns.name"),
      value: (row) => row.name,
    },
    {
      header: t("columns.phone"),
      value: (row) => displayDash(row.phone),
    },
    {
      header: t("columns.address"),
      value: (row) => displayDash(row.address),
    },
    {
      header: t("columns.status"),
      value: (row) => t(`status.${row.status}`),
    },
  ];
}

export function buildOwnerSalesExportColumns (
  t: Translator,
  tPayment: Translator,
  format: Formatter,
): ExportColumn<OwnerSaleListItem>[] {
  return [
    {
      header: t("columns.receiptNumber"),
      value: (row) => row.receiptNumber,
    },
    {
      header: t("columns.date"),
      value: (row) => formatDateTime(format, row.completedAt),
    },
    {
      header: t("columns.cashier"),
      value: (row) => row.cashierName,
    },
    {
      header: t("columns.total"),
      value: (row) => formatCurrency(row.total),
    },
    {
      header: t("columns.paymentMethod"),
      value: (row) => tPayment(row.paymentMethod),
    },
    {
      header: t("columns.status"),
      value: (row) => t(`status.${row.status}`),
    },
  ];
}

export function buildMySalesExportColumns (
  t: Translator,
  format: Formatter,
): ExportColumn<SaleListItem>[] {
  return [
    {
      header: t("columns.receiptNumber"),
      value: (row) => row.receiptNumber,
    },
    {
      header: t("columns.date"),
      value: (row) => formatDateTime(format, row.completedAt),
    },
    {
      header: t("columns.total"),
      value: (row) => formatCurrency(row.total),
    },
    {
      header: t("columns.paymentMethod"),
      value: (row) => t(`payment.${row.paymentMethod}`),
    },
    {
      header: t("columns.status"),
      value: (row) => t(`status.${row.status}`),
    },
  ];
}

export function buildStockMovementsExportColumns (
  t: Translator,
  format: Formatter,
): ExportColumn<StockMovementListItem>[] {
  return [
    {
      header: t("columns.date"),
      value: (row) => formatDateTime(format, row.createdAt),
    },
    {
      header: t("columns.product"),
      value: (row) => row.productName,
    },
    {
      header: t("export.sku"),
      value: (row) => row.productSku,
    },
    {
      header: t("columns.type"),
      value: (row) => t(`type.${row.movementType}`),
    },
    {
      header: t("columns.quantity"),
      value: (row) => formatQuantityDelta(row.quantityDelta, format),
    },
    {
      header: t("columns.oldStock"),
      value: (row) => row.oldStock,
    },
    {
      header: t("columns.newStock"),
      value: (row) => row.newStock,
    },
    {
      header: t("columns.user"),
      value: (row) => row.createdByName,
    },
    {
      header: t("export.notes"),
      value: (row) => displayDash(row.notes),
    },
  ];
}

export function buildStockReceivesExportColumns (
  t: Translator,
  format: Formatter,
): ExportColumn<StockReceiveListItem>[] {
  return [
    {
      header: t("columns.reference"),
      value: (row) => displayDash(row.referenceNumber),
    },
    {
      header: t("columns.supplier"),
      value: (row) => row.supplierName ?? t("noSupplier"),
    },
    {
      header: t("columns.date"),
      value: (row) => formatDateTime(format, row.receivedAt, false),
    },
    {
      header: t("columns.items"),
      value: (row) => row.itemCount,
    },
    {
      header: t("columns.receivedBy"),
      value: (row) => row.receivedByName,
    },
  ];
}

export function buildStaffUsersExportColumns (
  t: Translator,
  format: Formatter,
): ExportColumn<StaffUserListItem>[] {
  return [
    {
      header: t("columns.fullName"),
      value: (row) => row.fullName?.trim() || row.email,
    },
    {
      header: t("columns.email"),
      value: (row) => row.email,
    },
    {
      header: t("columns.role"),
      value: (row) => t(`role.${row.role}`),
    },
    {
      header: t("columns.status"),
      value: (row) => t(`status.${row.accountStatus}`),
    },
    {
      header: t("columns.createdAt"),
      value: (row) => formatDateTime(format, row.createdAt, false),
    },
  ];
}
