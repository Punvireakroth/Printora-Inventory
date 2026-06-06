"use client";

import type { SaleReceipt } from "@/features/sales/types/pos";
import { Button } from "@/components/ui/button";
import { LoadingLink } from "@/components/layout/loading-link";
import { BRAND_LOGO_PATH } from "@/constants/brand";
import { useFormatter, useTranslations } from "next-intl";

type SaleReceiptViewProps = {
  receipt: SaleReceipt;
};

const RECEIPT_TERM_KEYS = ["1", "2", "3"] as const;

function formatReceiptAmount (amount: number): string {
  return `$ ${amount.toFixed(2)}`;
}

function receiptCellClassName (extra?: string): string {
  return [
    "border border-black px-1.5 py-1 align-middle text-black",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function SaleReceiptView ({ receipt }: SaleReceiptViewProps) {
  const t = useTranslations("pos.receipt");
  const format = useFormatter();

  function handlePrint () {
    window.print();
  }

  const SaleDate = format.dateTime(new Date(receipt.completedAt), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <article className="sale-receipt rounded-xl border border-border bg-card p-6 shadow-sm print:border-0 print:bg-white print:p-0 print:shadow-none">
        <header className="space-y-2 text-center text-black">
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="h-14 w-auto max-w-[min(100%,16rem)] object-contain print:h-12"
              src={BRAND_LOGO_PATH}
            />
          </div>
          <p className="text-sm leading-relaxed">{t("shopAddress")}</p>
          <p className="text-sm">
            {t("tel")} : {t("shopPhone")}
          </p>
        </header>

        <hr className="my-4 border-0 border-t-[3px] border-double border-black" />

        <h2 className="mb-4 text-center text-lg font-bold uppercase tracking-wide text-black underline underline-offset-4">
          {t("documentTitle")}
        </h2>

        <div className="mb-4 grid gap-4 text-sm text-black sm:grid-cols-2">
          <div className="space-y-1">
            <p>
              <span className="font-medium">{t("cashierLabel")}</span>{" "}
              {receipt.cashierName}
            </p>
            <p>
              <span className="font-medium">{t("paymentMethod")}</span> :{" "}
              {t(`payment.${receipt.paymentMethod}`)}
            </p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p>
              {t("invoiceNo")} : {receipt.receiptNumber}
            </p>
            <p>
              {t("date")} : {SaleDate}
            </p>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-xs text-black">
          <thead>
            <tr className="bg-white">
              <th className={receiptCellClassName("w-10 text-center font-semibold")}>
                {t("columns.no")}
              </th>
              <th className={receiptCellClassName("min-w-[140px] text-left font-semibold")}>
                {t("columns.description")}
              </th>
              <th className={receiptCellClassName("w-16 text-center font-semibold")}>
                {t("columns.size")}
              </th>
              <th className={receiptCellClassName("w-14 text-center font-semibold")}>
                {t("columns.quantity")}
              </th>
              <th className={receiptCellClassName("w-14 text-center font-semibold")}>
                {t("columns.unit")}
              </th>
              <th className={receiptCellClassName("w-24 text-right font-semibold")}>
                {t("columns.unitPrice")}
              </th>
              <th className={receiptCellClassName("w-24 text-right font-semibold")}>
                {t("columns.amount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, index) => (
              <tr key={item.id}>
                <td className={receiptCellClassName("text-center tabular-nums")}>
                  {index + 1}
                </td>
                <td className={receiptCellClassName("text-left")}>
                  <div>{item.productName}</div>
                  {item.sku ? (
                    <div className="text-[10px] text-black/70">{item.sku}</div>
                  ) : null}
                  {item.lineDiscount > 0 ? (
                    <div className="text-[10px] text-black/70">
                      {t("lineDiscount", {
                        amount: formatReceiptAmount(item.lineDiscount),
                      })}
                    </div>
                  ) : null}
                </td>
                <td className={receiptCellClassName("text-center")}>
                  {item.size?.trim() || t("emptySize")}
                </td>
                <td className={receiptCellClassName("text-center tabular-nums")}>
                  {item.quantity}
                </td>
                <td className={receiptCellClassName("text-center")}>
                  {t("unitPcs")}
                </td>
                <td className={receiptCellClassName("text-right tabular-nums")}>
                  {formatReceiptAmount(item.unitPrice)}
                </td>
                <td className={receiptCellClassName("text-right tabular-nums")}>
                  {formatReceiptAmount(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-0 flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl flex-1 text-black">
            <div className="flex flex-row items-start gap-2 print:break-inside-avoid">
              <ul className="list-none space-y-1 text-[11px] leading-relaxed">
                {RECEIPT_TERM_KEYS.map((key) => (
                  <li key={key}>{t(`terms.${key}`)}</li>
                ))}
              </ul>
              <div className="flex shrink-0 flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="h-32 w-auto rounded-lg border border-black/10 bg-white object-contain"
                  height={128}
                  src="/QR-Code.png"
                  width={128}
                />
                <p className="max-w-[9rem] text-center text-[11px] font-medium">
                  {t("scanQr")}
                </p>
              </div>
            </div>
          </div>

          <table className="w-full max-w-xs shrink-0 border-collapse border border-black text-xs text-black sm:w-64">
            <tbody>
              <tr>
                <td className={receiptCellClassName("font-medium")}>
                  {t("totalRow")}
                </td>
                <td className={receiptCellClassName("text-right tabular-nums")}>
                  {formatReceiptAmount(receipt.subtotal)}
                </td>
              </tr>
              {receipt.discountAmount > 0 ? (
                <tr>
                  <td className={receiptCellClassName("font-medium")}>
                    {t("discount")}
                  </td>
                  <td className={receiptCellClassName("text-right tabular-nums")}>
                    {formatReceiptAmount(receipt.discountAmount)}
                  </td>
                </tr>
              ) : null}
              <tr>
                <td className={receiptCellClassName("font-medium")}>
                  {t("deposit")}
                </td>
                <td className={receiptCellClassName("text-right tabular-nums")}>
                  $ —
                </td>
              </tr>
              <tr>
                <td className={receiptCellClassName("font-semibold")}>
                  {t("balance")}
                </td>
                <td className={receiptCellClassName("text-right tabular-nums font-semibold")}>
                  {formatReceiptAmount(receipt.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
