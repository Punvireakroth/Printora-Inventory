"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleSupplierStatus } from "@/features/suppliers/actions/toggle-supplier-status";
import { SupplierFormSheet } from "@/features/suppliers/components/supplier-form-sheet";
import type { SupplierListItem } from "@/features/suppliers/types/supplier";
import { LoadingLink } from "@/components/layout/loading-link";
import { ListExportButton } from "@/components/layout/list-export-button";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { buildSuppliersExportColumns } from "@/lib/export/list-export-columns";
import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type SuppliersPanelProps = {
  suppliers: SupplierListItem[];
};

function displayDash (value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

function SupplierRow ({ supplier }: { supplier: SupplierListItem }) {
  const t = useTranslations("suppliers");
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const [status, setStatus] = useState(supplier.status);
  const [editOpen, setEditOpen] = useState(false);
  const isActive = status === "ACTIVE";

  function handleStatusChange (checked: boolean) {
    const nextStatus = checked ? "ACTIVE" : "INACTIVE";
    const previous = status;
    setStatus(nextStatus);

    void run(async () => {
      const result = await toggleSupplierStatus({
        supplierId: supplier.id,
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
      <TableCell className="px-4 py-3 font-medium whitespace-normal">
        <span className="line-clamp-2">{supplier.name}</span>
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground whitespace-normal">
        {displayDash(supplier.phone)}
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground whitespace-normal">
        <span className="line-clamp-2">{displayDash(supplier.address)}</span>
      </TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">
        <Badge variant={isActive ? "active" : "destructive"}>
          {t(`status.${status}`)}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">
        <div className="flex items-center justify-end gap-2">
          <Button
            aria-label={t("editAria", { name: supplier.name })}
            onClick={() => setEditOpen(true)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Pencil aria-hidden className="size-4" />
          </Button>
          <Switch
            aria-label={t("toggleAria", { name: supplier.name })}
            checked={isActive}
            disabled={isLoading}
            onCheckedChange={handleStatusChange}
          />
          <SupplierFormSheet
            mode="edit"
            onOpenChange={setEditOpen}
            onSuccess={() => setEditOpen(false)}
            open={editOpen}
            supplier={supplier}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SuppliersPanel ({ suppliers }: SuppliersPanelProps) {
  const t = useTranslations("suppliers");
  const tNav = useTranslations("navigation");
  const [createOpen, setCreateOpen] = useState(false);
  const exportColumns = useMemo(
    () => buildSuppliersExportColumns(t),
    [t],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <nav
            aria-label={t("breadcrumbAria")}
            className="text-base text-primary"
          >
            <LoadingLink
              className="text-primary hover:text-primary/80"
              href="/settings"
            >
              {tNav("settings")}
            </LoadingLink>
            <span aria-hidden className="mx-2 text-primary">
              /
            </span>
            <span className="text-primary">{t("title")}</span>
          </nav>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ListExportButton
            columns={exportColumns}
            filenameBase="suppliers"
            rows={suppliers}
          />
          <Button onClick={() => setCreateOpen(true)} type="button">
            <Plus aria-hidden className="size-4" />
            {t("add")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {suppliers.length === 0 ? (
          <p className="p-8 text-center text-base text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <Table
            className="table-fixed"
            containerClassName="overflow-x-hidden"
          >
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%] px-4 py-3 whitespace-normal">
                  {t("columns.name")}
                </TableHead>
                <TableHead className="w-[18%] px-4 py-3 whitespace-normal">
                  {t("columns.phone")}
                </TableHead>
                <TableHead className="w-[30%] px-4 py-3 whitespace-normal">
                  {t("columns.address")}
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 whitespace-normal">
                  {t("columns.status")}
                </TableHead>
                <TableHead className="w-[18%] px-4 py-3 text-right whitespace-normal">
                  {t("columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <SupplierRow key={supplier.id} supplier={supplier} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <SupplierFormSheet
        mode="create"
        onOpenChange={setCreateOpen}
        onSuccess={() => setCreateOpen(false)}
        open={createOpen}
      />
    </div>
  );
}
