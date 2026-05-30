"use client";

import type { SaleReceipt } from "@/features/sales/types/pos";
import { Button } from "@/components/ui/button";
import { LoadingLink } from "@/components/layout/loading-link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useFormatter, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";

type SaleReceiptViewProps = {
  receipt: SaleReceipt;
};

export function SaleReceiptView ({ receipt }: SaleReceiptViewProps) {
  const t = useTranslations("pos.receipt");
  const format = useFormatter();

  function handlePrint () {
    window.print();
  }

  const businessLabel = receipt.businessName?.trim() || t("defaultBusinessName");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <article className="rounded-xl border border-border bg-card p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <header className="space-y-3 border-b border-border pb-4 text-center print:border-black">
          <div className="flex justify-center print:hidden">
            <BrandLogo alt={businessLabel} size="md" />
          </div>
          <h1 className="font-heading text-xl font-semibold">{businessLabel}</h1>
          <p className="text-sm text-muted-foreground print:text-black">
            {receipt.receiptNumber}
          </p>
        </header>

        <dl className="grid gap-2 py-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground print:text-black">{t("cashier")}</dt>
            <dd>{receipt.cashierName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground print:text-black">{t("date")}</dt>
            <dd>
              {format.dateTime(new Date(receipt.completedAt), {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground print:text-black">{t("paymentMethod")}</dt>
            <dd>{t(`payment.${receipt.paymentMethod}`)}</dd>
          </div>
        </dl>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground print:border-black print:text-black">
              <th className="py-2 pr-2 font-medium">{t("columns.product")}</th>
              <th className="px-2 py-2 text-right font-medium">{t("columns.qty")}</th>
              <th className="px-2 py-2 text-right font-medium">{t("columns.price")}</th>
              <th className="py-2 pl-2 text-right font-medium">{t("columns.total")}</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item) => (
              <tr className="border-b border-border/60 print:border-black/20" key={item.id}>
                <td className="py-2 pr-2 align-top">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-xs text-muted-foreground print:text-black/70">
                    {item.sku}
                  </div>
                  {item.lineDiscount > 0 ? (
                    <div className="text-xs text-muted-foreground print:text-black/70">
                      {t("lineDiscount", {
                        amount: formatCurrency(item.lineDiscount),
                      })}
                    </div>
                  ) : null}
                </td>
                <td className="px-2 py-2 text-right tabular-nums align-top">
                  {item.quantity}
                </td>
                <td className="px-2 py-2 text-right tabular-nums align-top">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-2 pl-2 text-right tabular-nums align-top">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="mt-4 space-y-2 border-t border-border pt-4 text-sm print:border-black">
          <div className="flex justify-between tabular-nums">
            <span className="text-muted-foreground print:text-black">{t("subtotal")}</span>
            <span>
              {formatCurrency(receipt.subtotal)}
            </span>
          </div>
          <div className="flex justify-between tabular-nums">
            <span className="text-muted-foreground print:text-black">{t("discount")}</span>
            <span>
              {formatCurrency(receipt.discountAmount)}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold tabular-nums">
            <span>{t("total")}</span>
            <span>
              {formatCurrency(receipt.total)}
            </span>
          </div>
        </footer>
      </article>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button onClick={handlePrint} type="button">
          {t("print")}
        </Button>
        <LoadingLink
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-base font-medium hover:bg-muted"
          href="/pos"
        >
          {t("newSale")}
        </LoadingLink>
      </div>
    </div>
  );
}
