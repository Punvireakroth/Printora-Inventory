"use client";

import { completeSale } from "@/features/sales/actions/complete-sale";
import type { CompleteSaleFailureCode } from "@/features/sales/services/complete-sale";
import { PosProductBrowser } from "@/features/sales/components/pos-product-browser";
import type {
  PaymentMethod,
  PosCartLine,
  PosProductHit,
  PosSettings,
} from "@/features/sales/types/pos";
import type { LookupOption } from "@/features/products/types/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/ui/field-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/features/auth/components/current-user-provider";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { useRouter } from "@/i18n/navigation";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type PosScreenProps = {
  settings: PosSettings;
  categories: LookupOption[];
  initialProducts: PosProductHit[];
  initialTotalCount: number;
};

type SubmitErrorCode = CompleteSaleFailureCode | "invalid_input";

const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "BANK_TRANSFER",
  "ABA",
  "OTHER",
];

const HIGHLIGHT_MS = 700;

function lineSubtotal (line: PosCartLine): number {
  return line.quantity * line.unitPrice;
}

function lineTotal (line: PosCartLine): number {
  return lineSubtotal(line) - line.lineDiscount;
}

export function PosScreen ({
  settings,
  categories,
  initialProducts,
  initialTotalCount,
}: PosScreenProps) {
  const t = useTranslations("pos");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const { isCashier } = useCurrentUser();

  const [cartLines, setCartLines] = useState<PosCartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [submitError, setSubmitError] = useState<SubmitErrorCode | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(
    null,
  );

  const allowDiscount = settings.allowCashierDiscount || !isCashier;

  const paymentOptions = useMemo(
    () =>
      PAYMENT_METHODS.map((method) => ({
        value: method,
        label: t(`payment.${method}`),
      })),
    [t],
  );

  const cartQuantities = useMemo(
    () =>
      Object.fromEntries(
        cartLines.map((line) => [line.productId, line.quantity]),
      ),
    [cartLines],
  );

  const cartItemCount = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.quantity, 0),
    [cartLines],
  );

  const cartSubtotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + lineSubtotal(line), 0),
    [cartLines],
  );

  const cartDiscount = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.lineDiscount, 0),
    [cartLines],
  );

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + lineTotal(line), 0),
    [cartLines],
  );

  useEffect(() => {
    if (!highlightedProductId) {
      return;
    }

    const handle = setTimeout(() => {
      setHighlightedProductId(null);
    }, HIGHLIGHT_MS);

    return () => clearTimeout(handle);
  }, [highlightedProductId]);

  function flashProduct (productId: string) {
    setHighlightedProductId(productId);
  }

  function addOrIncrementProduct (product: PosProductHit) {
    if (product.currentStock <= 0) {
      setSubmitError("insufficient_stock");
      return;
    }

    setSubmitError(null);

    const existing = cartLines.find((line) => line.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.currentStock) {
        setSubmitError("insufficient_stock");
        return;
      }

      updateLine(product.id, { quantity: existing.quantity + 1 });
      flashProduct(product.id);
      return;
    }

    setCartLines((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.sellingPrice,
        currentStock: product.currentStock,
        quantity: 1,
        lineDiscount: 0,
      },
    ]);
    flashProduct(product.id);
  }

  function updateLine (
    productId: string,
    patch: Partial<Pick<PosCartLine, "quantity" | "lineDiscount">>,
  ) {
    setCartLines((prev) =>
      prev.map((line) => {
        if (line.productId !== productId) {
          return line;
        }

        const nextQuantity = patch.quantity ?? line.quantity;
        const nextDiscount = patch.lineDiscount ?? line.lineDiscount;
        const quantity = Math.min(Math.max(1, nextQuantity), line.currentStock);
        const lineSub = quantity * line.unitPrice;
        const lineDiscount = Math.min(Math.max(0, nextDiscount), lineSub);

        return { ...line, quantity, lineDiscount };
      }),
    );
  }

  function removeLine (productId: string) {
    setCartLines((prev) => prev.filter((line) => line.productId !== productId));
  }

  function clearCart () {
    setCartLines([]);
    setSubmitError(null);
  }

  function handleCompleteSale () {
    setSubmitError(null);

    if (cartLines.length === 0) {
      setSubmitError("no_items");
      return;
    }

    const overStock = cartLines.find((line) => line.quantity > line.currentStock);
    if (overStock) {
      setSubmitError("insufficient_stock");
      return;
    }

    void run(async () => {
      const result = await completeSale({
        paymentMethod,
        items: cartLines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          lineDiscount: allowDiscount ? line.lineDiscount : 0,
        })),
      });

      if (!result.ok) {
        setSubmitError(result.code);
        return;
      }

      router.push(`/pos/receipt/${result.saleId}`);
    });
  }

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col gap-4 xl:flex-row xl:items-stretch">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PosProductBrowser
          cartQuantities={cartQuantities}
          categories={categories}
          disabled={isLoading}
          highlightedProductId={highlightedProductId}
          initialProducts={initialProducts}
          initialTotalCount={initialTotalCount}
          onSelectProduct={addOrIncrementProduct}
        />
      </section>

      <aside className="w-full shrink-0 xl:w-[min(100%,24rem)]">
        <div className="xl:sticky xl:top-4">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingCart aria-hidden className="size-5" />
                <h2 className="font-heading text-lg font-semibold">
                  {t("cart.title")}
                </h2>
                {cartItemCount > 0 ? (
                  <Badge variant="secondary">
                    {t("cart.itemCount", { count: cartItemCount })}
                  </Badge>
                ) : null}
              </div>
              {cartLines.length > 0 ? (
                <Button
                  disabled={isLoading}
                  onClick={clearCart}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden className="size-4" />
                  {t("cart.cancelSale")}
                </Button>
              ) : null}
            </div>

            <div className="max-h-[min(50dvh,28rem)] overflow-y-auto px-4">
              {cartLines.length === 0 ? (
                <p className="py-10 text-center text-base text-muted-foreground">
                  {t("cart.empty")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {cartLines.map((line) => (
                    <li className="py-3 first:pt-3 last:pb-3" key={line.productId}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{line.name}</p>
                          <p className="text-sm text-muted-foreground">{line.sku}</p>
                        </div>
                        <Button
                          aria-label={t("cart.removeAria", { name: line.name })}
                          disabled={isLoading}
                          onClick={() => removeLine(line.productId)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          aria-label={t("cart.decreaseQty", { name: line.name })}
                          disabled={isLoading || line.quantity <= 1}
                          onClick={() =>
                            updateLine(line.productId, {
                              quantity: line.quantity - 1,
                            })
                          }
                          size="icon-sm"
                          type="button"
                          variant="outline"
                        >
                          <Minus className="size-4" />
                        </Button>
                        <Input
                          aria-label={t("cart.quantityAria", { name: line.name })}
                          className="h-9 w-16 text-center tabular-nums"
                          disabled={isLoading}
                          inputMode="numeric"
                          min={1}
                          max={line.currentStock}
                          onChange={(event) => {
                            const value = Number.parseInt(event.target.value, 10);
                            updateLine(line.productId, {
                              quantity: Number.isFinite(value) ? value : 1,
                            });
                          }}
                          type="number"
                          value={line.quantity}
                        />
                        <Button
                          aria-label={t("cart.increaseQty", { name: line.name })}
                          disabled={
                            isLoading || line.quantity >= line.currentStock
                          }
                          onClick={() =>
                            updateLine(line.productId, {
                              quantity: line.quantity + 1,
                            })
                          }
                          size="icon-sm"
                          type="button"
                          variant="outline"
                        >
                          <Plus className="size-4" />
                        </Button>
                        <span className="ml-auto text-sm font-medium tabular-nums">
                          {format.number(lineTotal(line), {
                            style: "currency",
                            currency: "USD",
                          })}
                        </span>
                      </div>

                      {line.quantity >= line.currentStock ? (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                          {t("cart.maxStock", { count: line.currentStock })}
                        </p>
                      ) : null}

                      {allowDiscount ? (
                        <div className="mt-2 space-y-1">
                          <Label
                            className="text-xs"
                            htmlFor={`discount-${line.productId}`}
                          >
                            {t("cart.lineDiscount")}
                          </Label>
                          <Input
                            disabled={isLoading}
                            id={`discount-${line.productId}`}
                            inputMode="decimal"
                            min={0}
                            onChange={(event) => {
                              const value = Number.parseFloat(event.target.value);
                              updateLine(line.productId, {
                                lineDiscount: Number.isFinite(value) ? value : 0,
                              });
                            }}
                            step="0.01"
                            type="number"
                            value={line.lineDiscount}
                          />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4 border-t border-border p-4">
              <div className="space-y-2 text-base">
                <div className="flex justify-between tabular-nums">
                  <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                  <span>
                    {format.number(cartSubtotal, {
                      style: "currency",
                      currency: "USD",
                    })}
                  </span>
                </div>
                <div className="flex justify-between tabular-nums">
                  <span className="text-muted-foreground">{t("cart.discount")}</span>
                  <span>
                    {format.number(cartDiscount, {
                      style: "currency",
                      currency: "USD",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold tabular-nums">
                  <span>{t("cart.total")}</span>
                  <span>
                    {format.number(cartTotal, {
                      style: "currency",
                      currency: "USD",
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pos-payment">{t("cart.paymentMethod")}</Label>
                <FieldSelect
                  disabled={isLoading}
                  id="pos-payment"
                  onValueChange={(value) =>
                    setPaymentMethod(value as PaymentMethod)
                  }
                  options={paymentOptions}
                  value={paymentMethod}
                />
              </div>

              {submitError ? (
                <p className="text-sm text-destructive" role="alert">
                  {t(`errors.${submitError}`)}
                </p>
              ) : null}

              <Button
                aria-busy={isLoading}
                className="h-11 w-full text-base"
                disabled={isLoading || cartLines.length === 0}
                onClick={handleCompleteSale}
                type="button"
              >
                {isLoading ? (
                  <Spinner label={tCommon("loading")} size="sm" />
                ) : null}
                {isLoading ? tCommon("loading") : t("cart.completeSale")}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
