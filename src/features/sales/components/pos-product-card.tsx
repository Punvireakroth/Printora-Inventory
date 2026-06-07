"use client";

import type { PosProductHit } from "@/features/sales/types/pos";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { Check, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type PosProductCardProps = {
  product: PosProductHit;
  cartQuantity: number;
  disabled?: boolean;
  highlighted?: boolean;
  onSelect: () => void;
};

export function PosProductCard ({
  product,
  cartQuantity,
  disabled = false,
  highlighted = false,
  onSelect,
}: PosProductCardProps) {
  const t = useTranslations("pos");
  const format = useFormatter();

  const outOfStock = product.currentStock <= 0;
  const inCart = cartQuantity > 0;
  const atMax = inCart && cartQuantity >= product.currentStock;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.imageUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [product.id, product.imageUrl]);

  return (
    <button
      aria-label={t("product.addAria", { name: product.name })}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all",
        "focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:outline-none",
        outOfStock
          ? "cursor-not-allowed border-border/60 opacity-60"
          : "border-border hover:border-primary/50 hover:shadow-md active:scale-[0.98]",
        inCart && !outOfStock && "border-primary/40 ring-1 ring-primary/20",
        highlighted && "ring-2 ring-primary/60",
      )}
      disabled={disabled || outOfStock}
      onClick={onSelect}
      type="button"
    >
      <div className="relative w-full shrink-0 bg-muted/40">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]"
            decoding="async"
            onError={() => setImageFailed(true)}
            src={product.imageUrl!}
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
            {t("search.noImage")}
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
          {product.isLowStock && !outOfStock ? (
            <Badge className="shadow-sm" variant="destructive">
              {t("search.lowStock")}
            </Badge>
          ) : (
            <span />
          )}
          {inCart ? (
            <Badge
              className="gap-1 bg-primary text-primary-foreground shadow-sm"
              variant="default"
            >
              <Check aria-hidden className="size-3" />
              {t("product.inCart", { count: cartQuantity })}
            </Badge>
          ) : null}
        </div>

        {!outOfStock ? (
          <div
            className={cn(
              "absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full shadow-md transition-colors",
              inCart
                ? "bg-primary text-primary-foreground"
                : "bg-background/95 text-foreground group-hover:bg-primary group-hover:text-primary-foreground",
            )}
          >
            <Plus aria-hidden className="size-4" />
          </div>
        ) : (
          <Badge
            className="absolute right-2 bottom-2 shadow-sm"
            variant="destructive"
          >
            {t("product.outOfStock")}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 font-medium leading-snug">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {product.sku}
          {product.size ? ` · ${product.size}` : ""}
          {product.color ? ` · ${product.color}` : ""}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {product.categoryName}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-semibold tabular-nums">
            {formatCurrency(product.sellingPrice)}
          </span>
          <span
            className={cn(
              "text-xs tabular-nums",
              outOfStock
                ? "text-destructive"
                : product.isLowStock
                  ? "font-medium text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground",
            )}
          >
            {t("search.stock", { count: product.currentStock })}
          </span>
        </div>
        {atMax ? (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t("cart.maxStock", { count: product.currentStock })}
          </p>
        ) : null}
      </div>
    </button>
  );
}
