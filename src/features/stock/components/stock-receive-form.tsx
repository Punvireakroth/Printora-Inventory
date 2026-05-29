"use client";

import { createStockReceive } from "@/features/stock/actions/create-stock-receive";
import type { CreateStockReceiveFailureCode } from "@/features/stock/services/create-stock-receive";
import { searchProductsForReceiveAction } from "@/features/stock/actions/search-products-for-receive";
import type { LookupOption } from "@/features/products/types/product";
import type {
  ProductReceiveSearchHit,
  StockReceiveLineDraft,
} from "@/features/stock/types/stock-receive";
import {
  StockReceiveSchema,
  type StockReceiveInput,
} from "@/features/stock/validations/stock-receive-schema";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/ui/field-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { Link, useRouter } from "@/i18n/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

const textareaClassName =
  "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] focus-visible:outline-none";

type StockReceiveFormProps = {
  suppliers: LookupOption[];
  nextReference: string | null;
};

type SubmitErrorCode =
  | CreateStockReceiveFailureCode
  | "invalid_input"
  | "duplicate_product";

function todayDateInputValue (): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function StockReceiveForm ({
  suppliers,
  nextReference,
}: StockReceiveFormProps) {
  const t = useTranslations("stock.receive");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const searchFieldId = useId();

  const [lines, setLines] = useState<StockReceiveLineDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductReceiveSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitErrorCode | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<Pick<StockReceiveInput, "supplierId" | "receivedAt" | "notes">>({
    defaultValues: {
      supplierId: null,
      receivedAt: todayDateInputValue(),
      notes: "",
    },
  });

  const supplierOptions = useMemo(
    () => [
      { value: "", label: t("form.noSupplier") },
      ...suppliers.map((s) => ({ value: s.id, label: s.name })),
    ],
    [suppliers, t],
  );

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

  function addLine (product: ProductReceiveSearchHit) {
    if (lines.some((line) => line.productId === product.id)) {
      setSubmitError("duplicate_product");
      return;
    }

    setSubmitError(null);
    setLines((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitCost: product.costPrice,
        currentStock: product.currentStock,
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
  }

  function updateLine (
    productId: string,
    patch: Partial<Pick<StockReceiveLineDraft, "quantity" | "unitCost">>,
  ) {
    setLines((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, ...patch } : line,
      ),
    );
  }

  function removeLine (productId: string) {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }

  function handleSubmit () {
    setSubmitError(null);
    setSubmitSuccess(false);

    const payload: StockReceiveInput = {
      supplierId: form.getValues("supplierId"),
      receivedAt: form.getValues("receivedAt"),
      notes: form.getValues("notes") ?? "",
      items: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitCost: line.unitCost,
      })),
    };

    const parsed = StockReceiveSchema.safeParse(payload);
    if (!parsed.success) {
      setSubmitError("invalid_input");
      return;
    }

    void run(async () => {
      const result = await createStockReceive(parsed.data);
      if (!result.ok) {
        setSubmitError(result.code);
        return;
      }

      setSubmitSuccess(true);
      setLines([]);
      form.reset({
        supplierId: null,
        receivedAt: todayDateInputValue(),
        notes: "",
      });
      router.refresh();
    });
  }

  const referenceLabel = nextReference ?? t("form.referencePending");

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

      <section className="grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="receive-reference">{t("form.reference")}</Label>
          <Input
            disabled
            id="receive-reference"
            readOnly
            value={referenceLabel}
          />
          <p className="text-xs text-muted-foreground">{t("form.referenceHint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="receive-date">{t("form.receivedAt")}</Label>
          <Input
            id="receive-date"
            type="date"
            {...form.register("receivedAt")}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="receive-supplier">{t("form.supplier")}</Label>
          <FieldSelect
            id="receive-supplier"
            onValueChange={(value) => {
              form.setValue(
                "supplierId",
                value === "" ? null : value,
                { shouldDirty: true },
              );
            }}
            options={supplierOptions}
            placeholder={t("form.selectSupplier")}
            value={form.watch("supplierId") ?? ""}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="receive-notes">{t("form.notes")}</Label>
          <textarea
            className={textareaClassName}
            id="receive-notes"
            {...form.register("notes")}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t("lines.title")}</h2>
          <p className="text-base text-muted-foreground">{t("lines.subtitle")}</p>
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <Label htmlFor={searchFieldId}>{t("lines.searchLabel")}</Label>
          <Input
            autoComplete="off"
            id={searchFieldId}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("lines.searchPlaceholder")}
            value={searchQuery}
          />
          {searchLoading ? (
            <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
          ) : null}
          {searchResults.length > 0 ? (
            <ul
              className="max-h-48 divide-y divide-border overflow-y-auto rounded-md border border-border"
              role="listbox"
            >
              {searchResults.map((product) => (
                <li key={product.id}>
                  <button
                    className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-base hover:bg-muted/60"
                    onClick={() => addLine(product)}
                    type="button"
                  >
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.sku} · {t("lines.stockNow", { count: product.currentStock })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {searchQuery.trim().length >= 2 &&
          !searchLoading &&
          searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("lines.noResults")}</p>
          ) : null}
        </div>

        {lines.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-base text-muted-foreground">
            {t("lines.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">{t("lines.columns.product")}</TableHead>
                  <TableHead className="px-4 py-3">{t("lines.columns.sku")}</TableHead>
                  <TableHead className="min-w-[96px] px-4 py-3">{t("lines.columns.quantity")}</TableHead>
                  <TableHead className="min-w-[120px] px-4 py-3">{t("lines.columns.unitCost")}</TableHead>
                  <TableHead className="px-4 py-3 text-right">{t("lines.columns.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.productId}>
                    <TableCell className="px-4 py-3 font-medium whitespace-normal">
                      {line.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {line.sku}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        aria-label={t("lines.quantityAria", { name: line.name })}
                        inputMode="numeric"
                        min={1}
                        onChange={(event) => {
                          const value = Number.parseInt(event.target.value, 10);
                          updateLine(line.productId, {
                            quantity: Number.isFinite(value) && value > 0 ? value : 1,
                          });
                        }}
                        type="number"
                        value={line.quantity}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        aria-label={t("lines.unitCostAria", { name: line.name })}
                        inputMode="decimal"
                        min={0}
                        onChange={(event) => {
                          const value = Number.parseFloat(event.target.value);
                          updateLine(line.productId, {
                            unitCost: Number.isFinite(value) && value >= 0 ? value : 0,
                          });
                        }}
                        step="0.01"
                        type="number"
                        value={line.unitCost}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        aria-label={t("lines.removeAria", { name: line.name })}
                        onClick={() => removeLine(line.productId)}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {lines.length > 0 ? (
          <p className="text-sm text-muted-foreground tabular-nums">
            {t("lines.totalUnits", {
              count: lines.reduce((sum, line) => sum + line.quantity, 0),
            })}
            {" · "}
            {t("lines.totalCost", {
              amount: format.number(
                lines.reduce(
                  (sum, line) => sum + line.quantity * line.unitCost,
                  0,
                ),
                { style: "currency", currency: "USD" },
              ),
            })}
          </p>
        ) : null}
      </section>

      {submitError ? (
        <p className="text-base text-destructive" role="alert">
          {t(`errors.${submitError}`)}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isLoading || lines.length === 0}
          onClick={handleSubmit}
          type="button"
        >
          <Plus aria-hidden className="size-4" />
          {t("form.submit")}
        </Button>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-3 text-base font-medium hover:bg-muted"
          href="/dashboard"
        >
          {tCommon("cancel")}
        </Link>
      </div>
    </div>
  );
}
