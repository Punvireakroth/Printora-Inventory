"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleProductStatus } from "@/features/products/actions/toggle-product-status";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { ProductsFilters } from "@/features/products/components/products-filters";
import type {
  LookupOption,
  ProductListItem,
} from "@/features/products/types/product";
import { productIsLowStock } from "@/features/products/types/product";
import { Link } from "@/i18n/navigation";
import { Pencil, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

type ProductsPanelProps = {
  products: ProductListItem[];
  categories: LookupOption[];
  showCostPrice: boolean;
};

function ProductRow ({
  product,
  showCostPrice,
}: {
  product: ProductListItem;
  showCostPrice: boolean;
}) {
  const t = useTranslations("products");
  const format = useFormatter();
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const [status, setStatus] = useState(product.status);
  const isActive = status === "ACTIVE";
  const isLowStock = productIsLowStock(product);

  function handleStatusChange (checked: boolean) {
    const nextStatus = checked ? "ACTIVE" : "INACTIVE";
    const previous = status;
    setStatus(nextStatus);

    void run(async () => {
      const result = await toggleProductStatus({
        productId: product.id,
        status: nextStatus,
      });

      if (!result.ok) {
        setStatus(previous);
        return;
      }

      setStatus(result.status);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="px-4 py-3">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="size-12 rounded-md border border-border object-cover"
            height={48}
            src={product.imageUrl}
            width={48}
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
            {t("noImage")}
          </div>
        )}
      </TableCell>
      <TableCell className="px-4 py-3 font-medium whitespace-normal">
        <div className="flex flex-col gap-1">
          <span className="line-clamp-2">{product.name}</span>
          {isLowStock ? (
            <Badge variant="destructive">{t("lowStockBadge")}</Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">{product.sku}</TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">{product.categoryName}</TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">{product.size ?? "—"}</TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">{product.color ?? "—"}</TableCell>
      {showCostPrice ? (
        <TableCell className="px-4 py-3 tabular-nums">
          {format.number(product.costPrice, {
            style: "currency",
            currency: "USD",
          })}
        </TableCell>
      ) : null}
      <TableCell className="px-4 py-3 tabular-nums">
        {format.number(product.sellingPrice, {
          style: "currency",
          currency: "USD",
        })}
      </TableCell>
      <TableCell className="px-4 py-3 tabular-nums">{product.currentStock}</TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">
        <Badge variant={isActive ? "outline" : "destructive"}>
          {t(`status.${status}`)}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link
            aria-label={t("editAria", { name: product.name })}
            className="inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] hover:bg-muted"
            href={`/products/${product.id}/edit`}
          >
            <Pencil aria-hidden className="size-4" />
          </Link>
          <Switch
            aria-label={t("toggleAria", { name: product.name })}
            checked={isActive}
            disabled={isLoading}
            onCheckedChange={handleStatusChange}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProductsPanel ({
  products,
  categories,
  showCostPrice,
}: ProductsPanelProps) {
  const t = useTranslations("products");

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-base font-medium text-primary-foreground hover:bg-primary/80"
          href="/products/new"
        >
          <Plus aria-hidden className="size-4" />
          {t("addProduct")}
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        }
      >
        <ProductsFilters categories={categories} />
      </Suspense>

      <div className="rounded-xl border border-border bg-card">
        {products.length === 0 ? (
          <p className="p-8 text-center text-base text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <Table containerClassName="overflow-x-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px] px-4 py-3">{t("columns.image")}</TableHead>
                <TableHead className="min-w-[160px] px-4 py-3">{t("columns.name")}</TableHead>
                <TableHead className="min-w-[100px] px-4 py-3">{t("columns.sku")}</TableHead>
                <TableHead className="min-w-[120px] px-4 py-3">{t("columns.category")}</TableHead>
                <TableHead className="min-w-[80px] px-4 py-3">{t("columns.size")}</TableHead>
                <TableHead className="min-w-[80px] px-4 py-3">{t("columns.color")}</TableHead>
                {showCostPrice ? (
                  <TableHead className="min-w-[96px] px-4 py-3">{t("columns.cost")}</TableHead>
                ) : null}
                <TableHead className="min-w-[96px] px-4 py-3">{t("columns.price")}</TableHead>
                <TableHead className="min-w-[72px] px-4 py-3">{t("columns.stock")}</TableHead>
                <TableHead className="min-w-[96px] px-4 py-3">{t("columns.status")}</TableHead>
                <TableHead className="min-w-[96px] px-4 py-3 text-right">{t("columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  showCostPrice={showCostPrice}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
