"use client";

import { getStockReceiveDetailAction } from "@/features/stock/actions/get-stock-receive-detail";
import type {
  StockReceiveDetail,
  StockReceiveListItem,
} from "@/features/stock/types/stock-receive";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingLink } from "@/components/layout/loading-link";
import { ChevronDown, ChevronRight, History, Plus, SlidersHorizontal } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Fragment, useState } from "react";

type StockReceivesPanelProps = {
  receives: StockReceiveListItem[];
};

function displayReference (reference: string | null): string {
  return reference?.trim() || "—";
}

function ReceiveDetailBlock ({
  detail,
}: {
  detail: StockReceiveDetail;
}) {
  const t = useTranslations("stock.receives");
  const format = useFormatter();

  return (
    <div className="space-y-4 px-4 py-4">
      {detail.notes ? (
        <p className="text-base">
          <span className="font-medium text-foreground">{t("detail.notes")}:</span>{" "}
          <span className="text-muted-foreground">{detail.notes}</span>
        </p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-3 py-2">{t("detail.columns.product")}</TableHead>
            <TableHead className="px-3 py-2">{t("detail.columns.sku")}</TableHead>
            <TableHead className="px-3 py-2 text-right">{t("detail.columns.quantity")}</TableHead>
            <TableHead className="px-3 py-2 text-right">{t("detail.columns.unitCost")}</TableHead>
            <TableHead className="px-3 py-2 text-right">{t("detail.columns.lineTotal")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detail.lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="px-3 py-2 font-medium whitespace-normal">
                {line.productName}
              </TableCell>
              <TableCell className="px-3 py-2 text-muted-foreground">{line.sku}</TableCell>
              <TableCell className="px-3 py-2 text-right tabular-nums">
                {format.number(line.quantity)}
              </TableCell>
              <TableCell className="px-3 py-2 text-right tabular-nums">
                {format.number(line.unitCost, { style: "currency", currency: "USD" })}
              </TableCell>
              <TableCell className="px-3 py-2 text-right tabular-nums">
                {format.number(line.lineTotal, { style: "currency", currency: "USD" })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground tabular-nums">
        <span>
          {t("detail.totalUnits", { count: detail.totalUnits })}
        </span>
        <span>
          {t("detail.totalCost", {
            amount: format.number(detail.totalCost, {
              style: "currency",
              currency: "USD",
            }),
          })}
        </span>
      </div>
    </div>
  );
}

function ReceiveRow ({
  receive,
  expanded,
  onToggle,
  detail,
  detailLoading,
  toggleDisabled,
}: {
  receive: StockReceiveListItem;
  expanded: boolean;
  onToggle: () => void;
  detail: StockReceiveDetail | null | undefined;
  detailLoading: boolean;
  toggleDisabled: boolean;
}) {
  const t = useTranslations("stock.receives");
  const format = useFormatter();
  const reference = displayReference(receive.referenceNumber);

  return (
    <Fragment>
      <TableRow aria-expanded={expanded} className={expanded ? "bg-muted/40" : undefined}>
        <TableCell className="px-4 py-3">
          <Button
            aria-busy={detailLoading}
            aria-label={t("toggleDetailAria", { reference })}
            disabled={toggleDisabled}
            onClick={onToggle}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            {expanded ? (
              <ChevronDown aria-hidden className="size-4" />
            ) : (
              <ChevronRight aria-hidden className="size-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="px-4 py-3 font-medium tabular-nums">{reference}</TableCell>
        <TableCell className="px-4 py-3 whitespace-normal">
          {receive.supplierName ?? t("noSupplier")}
        </TableCell>
        <TableCell className="px-4 py-3 tabular-nums">
          {format.dateTime(new Date(receive.receivedAt), {
            dateStyle: "medium",
          })}
        </TableCell>
        <TableCell className="px-4 py-3 text-right tabular-nums">
          {format.number(receive.itemCount)}
        </TableCell>
        <TableCell className="px-4 py-3 whitespace-normal">{receive.receivedByName}</TableCell>
      </TableRow>
      {expanded ? (
        <TableRow>
          <TableCell className="bg-muted/20 p-0" colSpan={6}>
            {detailLoading ? (
              <div
                aria-live="polite"
                className="flex items-center justify-center gap-2 px-4 py-6 text-base text-muted-foreground"
              >
                <Spinner label={t("detail.loading")} size="sm" />
                {t("detail.loading")}
              </div>
            ) : detail ? (
              <ReceiveDetailBlock detail={detail} />
            ) : (
              <p className="px-4 py-6 text-base text-destructive">{t("detail.loadFailed")}</p>
            )}
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  );
}

export function StockReceivesPanel ({ receives }: StockReceivesPanelProps) {
  const t = useTranslations("stock.receives");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, StockReceiveDetail>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggle (receiveId: string) {
    if (expandedId === receiveId) {
      setExpandedId(null);
      return;
    }

    if (loadingId !== null) {
      return;
    }

    setExpandedId(receiveId);

    if (detailsById[receiveId]) {
      return;
    }

    setLoadingId(receiveId);
    try {
      const detail = await getStockReceiveDetailAction(receiveId);
      if (detail) {
        setDetailsById((prev) => ({ ...prev, [receiveId]: detail }));
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LoadingLink
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-base font-medium hover:bg-muted/50"
            href="/stock/movements"
          >
            <History aria-hidden className="size-4" />
            {t("movementsHistory")}
          </LoadingLink>
          <LoadingLink
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-base font-medium hover:bg-muted/50"
            href="/stock/adjust"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            {t("adjustStock")}
          </LoadingLink>
          <LoadingLink
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-base font-medium text-primary-foreground hover:bg-primary/80"
            href="/stock/receive"
          >
            <Plus aria-hidden className="size-4" />
            {t("newReceive")}
          </LoadingLink>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {receives.length === 0 ? (
          <p className="p-8 text-center text-base text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <Table containerClassName="overflow-x-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-4 py-3" />
                <TableHead className="min-w-[120px] px-4 py-3">{t("columns.reference")}</TableHead>
                <TableHead className="min-w-[140px] px-4 py-3">{t("columns.supplier")}</TableHead>
                <TableHead className="min-w-[120px] px-4 py-3">{t("columns.date")}</TableHead>
                <TableHead className="min-w-[80px] px-4 py-3 text-right">{t("columns.items")}</TableHead>
                <TableHead className="min-w-[140px] px-4 py-3">{t("columns.receivedBy")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receives.map((receive) => (
                <ReceiveRow
                  detail={detailsById[receive.id]}
                  detailLoading={loadingId === receive.id}
                  expanded={expandedId === receive.id}
                  key={receive.id}
                  onToggle={() => void handleToggle(receive.id)}
                  receive={receive}
                  toggleDisabled={loadingId !== null && loadingId !== receive.id}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
