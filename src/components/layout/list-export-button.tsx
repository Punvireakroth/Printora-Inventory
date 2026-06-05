"use client";

import { Button } from "@/components/ui/button";
import {
  buildExportFilename,
  downloadExcel,
  type ExportColumn,
} from "@/lib/export/excel";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type ListExportButtonProps<T> = {
  rows: T[];
  columns: ExportColumn<T>[];
  filenameBase: string;
  sheetName?: string;
  disabled?: boolean;
  variant?: "default" | "outline";
  className?: string;
};

export function ListExportButton<T> ({
  rows,
  columns,
  filenameBase,
  sheetName,
  disabled = false,
  variant = "outline",
  className,
}: ListExportButtonProps<T>) {
  const t = useTranslations("common");

  function handleExport () {
    if (rows.length === 0) {
      toast.warning(t("exportEmpty"));
      return;
    }

    downloadExcel({
      rows,
      columns,
      filename: buildExportFilename(filenameBase),
      sheetName,
    });
  }

  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={handleExport}
      type="button"
      variant={variant}
    >
      <Download aria-hidden className="size-4" />
      {t("exportExcel")}
    </Button>
  );
}
