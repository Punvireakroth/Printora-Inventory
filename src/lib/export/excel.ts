import * as XLSX from "xlsx";

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function rowsToAoA<T> (rows: T[], columns: ExportColumn<T>[]): unknown[][] {
  return [
    columns.map((column) => column.header),
    ...rows.map((row) =>
      columns.map((column) => {
        const value = column.value(row);
        return value ?? "";
      }),
    ),
  ];
}

export function buildExportFilename (baseName: string): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  return `${baseName}-${dateStamp}.xlsx`;
}

export function downloadExcel<T> ({
  rows,
  columns,
  filename,
  sheetName = "Data",
}: {
  rows: T[];
  columns: ExportColumn<T>[];
  filename: string;
  sheetName?: string;
}): void {
  const worksheet = XLSX.utils.aoa_to_sheet(rowsToAoA(rows, columns));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}
