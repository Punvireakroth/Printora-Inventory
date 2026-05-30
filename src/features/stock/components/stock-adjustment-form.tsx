"use client";

import { createStockAdjustment } from "@/features/stock/actions/create-stock-adjustment";
import { searchProductsForReceiveAction } from "@/features/stock/actions/search-products-for-receive";
import type { CreateStockAdjustmentFailureCode } from "@/features/stock/services/create-stock-adjustment";
import type { ProductReceiveSearchHit } from "@/features/stock/types/stock-receive";
import {
  StockAdjustmentSchema,
  type StockAdjustmentInput,
} from "@/features/stock/validations/stock-adjustment-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { LoadingLink } from "@/components/layout/loading-link";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { useRouter } from "@/i18n/navigation";
import { X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState } from "react";

const textareaClassName =
  "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] focus-visible:outline-none";

type SubmitErrorCode =
  | CreateStockAdjustmentFailureCode
  | "invalid_input";

export function StockAdjustmentForm () {
  const t = useTranslations("stock.adjust");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const searchFieldId = useId();
  const newQuantityFieldId = useId();
  const reasonFieldId = useId();

  const [selectedProduct, setSelectedProduct] = useState<ProductReceiveSearchHit | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductReceiveSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newQuantity, setNewQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitError, setSubmitError] = useState<SubmitErrorCode | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    const handle = setTimeout(() => {
      setSearchLoading(true);
      void searchProductsForReceiveAction(trimmed)
        .then((hits) => {
          setSearchResults(hits);
        })
        .finally(() => {
          setSearchLoading(false);
        });
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  const parsedNewQuantity = useMemo(() => {
    const trimmed = newQuantity.trim();
    if (trimmed === "") {
      return null;
    }
    const value = Number(trimmed);
    if (!Number.isInteger(value) || value < 0) {
      return null;
    }
    return value;
  }, [newQuantity]);

  const quantityDelta = useMemo(() => {
    if (selectedProduct === null || parsedNewQuantity === null) {
      return null;
    }
    return parsedNewQuantity - selectedProduct.currentStock;
  }, [parsedNewQuantity, selectedProduct]);

  function selectProduct (product: ProductReceiveSearchHit) {
    setSelectedProduct(product);
    setNewQuantity(String(product.currentStock));
    setSearchQuery("");
    setSearchResults([]);
    setSubmitError(null);
    setSubmitSuccess(false);
  }

  function clearProduct () {
    setSelectedProduct(null);
    setNewQuantity("");
    setSubmitError(null);
  }

  function handleSubmit () {
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!selectedProduct) {
      setSubmitError("invalid_input");
      return;
    }

    const payload: StockAdjustmentInput = {
      productId: selectedProduct.id,
      newQuantity: newQuantity.trim() === "" ? -1 : Number(newQuantity),
      reason,
    };

    const parsed = StockAdjustmentSchema.safeParse(payload);
    if (!parsed.success) {
      setSubmitError("invalid_input");
      return;
    }

    void run(async () => {
      const result = await createStockAdjustment(parsed.data);
      if (!result.ok) {
        setSubmitError(result.code);
        return;
      }

      setSubmitSuccess(true);
      setSelectedProduct(null);
      setNewQuantity("");
      setReason("");
      setSearchQuery("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {submitSuccess ? (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
        >
          {t("success")}
        </p>
      ) : null}

      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t("product.title")}</h2>
          <p className="text-base text-muted-foreground">{t("product.subtitle")}</p>
        </div>

        {selectedProduct ? (
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="min-w-0 space-y-1">
              <p className="font-medium">{selectedProduct.name}</p>
              <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
              <p className="text-sm tabular-nums">
                {t("product.currentStock", { count: selectedProduct.currentStock })}
              </p>
            </div>
            <Button
              aria-label={t("product.clearAria", { name: selectedProduct.name })}
              disabled={isLoading}
              onClick={clearProduct}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X aria-hidden className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={searchFieldId}>{t("product.searchLabel")}</Label>
            <Input
              autoComplete="off"
              disabled={isLoading}
              id={searchFieldId}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("product.searchPlaceholder")}
              value={searchQuery}
            />
            {searchLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner aria-hidden className="size-4" />
                {tCommon("loading")}
              </div>
            ) : null}
            {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("product.noResults")}</p>
            ) : null}
            {searchResults.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border border-border bg-background">
                {searchResults.map((product) => (
                  <li key={product.id}>
                    <button
                      className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50"
                      disabled={isLoading}
                      onClick={() => selectProduct(product)}
                      type="button"
                    >
                      <span className="font-medium">{product.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {product.sku} · {t("product.stockNow", { count: product.currentStock })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>

      {selectedProduct ? (
        <section className="grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={newQuantityFieldId}>{t("form.newQuantity")}</Label>
            <Input
              disabled={isLoading}
              id={newQuantityFieldId}
              inputMode="numeric"
              min={0}
              onChange={(event) => setNewQuantity(event.target.value)}
              step={1}
              type="number"
              value={newQuantity}
            />
            <p className="text-xs text-muted-foreground">{t("form.newQuantityHint")}</p>
          </div>

          <div className="space-y-2">
            <Label>{t("form.delta")}</Label>
            <div
              aria-live="polite"
              className="flex h-10 items-center rounded-md border border-input bg-muted/30 px-3 text-base tabular-nums"
            >
              {quantityDelta === null ? (
                <span className="text-muted-foreground">—</span>
              ) : quantityDelta === 0 ? (
                <span className="text-muted-foreground">{t("form.noChange")}</span>
              ) : (
                <span className={quantityDelta > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}>
                  {quantityDelta > 0 ? "+" : ""}
                  {format.number(quantityDelta)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("form.deltaHint")}</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={reasonFieldId}>{t("form.reason")}</Label>
            <textarea
              className={textareaClassName}
              disabled={isLoading}
              id={reasonFieldId}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("form.reasonPlaceholder")}
              value={reason}
            />
          </div>
        </section>
      ) : null}

      {submitError ? (
        <p className="text-base text-destructive" role="alert">
          {t(`errors.${submitError}`)}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isLoading || !selectedProduct}
          onClick={handleSubmit}
          type="button"
        >
          {isLoading ? tCommon("loading") : t("form.submit")}
        </Button>
        <LoadingLink
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-3 text-base font-medium hover:bg-muted"
          href="/stock/receives"
        >
          {t("cancelLink")}
        </LoadingLink>
      </div>
    </div>
  );
}
