export function dateOnlyToStartIso (dateOnly: string): string {
  return `${dateOnly}T00:00:00.000Z`;
}

export function dateOnlyToEndIso (dateOnly: string): string {
  return `${dateOnly}T23:59:59.999Z`;
}

function localDateOnly (date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type SaleHistoryPeriod = "today" | "week" | "month";

export function resolveSaleHistoryPeriod (
  period: SaleHistoryPeriod,
): { from: string; to: string } {
  const now = new Date();
  const to = localDateOnly(now);

  if (period === "today") {
    return { from: to, to };
  }

  if (period === "week") {
    const start = new Date(now);
    const day = start.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - daysFromMonday);
    return { from: localDateOnly(start), to };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: localDateOnly(monthStart), to };
}
