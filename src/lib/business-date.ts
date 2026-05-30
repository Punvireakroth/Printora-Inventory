/** Cambodia business timezone for day/month dashboard boundaries. */
export const BUSINESS_TIME_ZONE = "Asia/Phnom_Penh";

const BUSINESS_UTC_OFFSET = "+07:00";

function formatDateInBusinessZone (date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
  }).format(date);
}

function getBusinessYearMonth (date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 0);

  return { year, month };
}

export function getBusinessDayRange (reference = new Date()): {
  startIso: string;
  endIso: string;
} {
  const day = formatDateInBusinessZone(reference);

  return {
    startIso: `${day}T00:00:00.000${BUSINESS_UTC_OFFSET}`,
    endIso: `${day}T23:59:59.999${BUSINESS_UTC_OFFSET}`,
  };
}

export function getBusinessMonthRange (reference = new Date()): {
  startIso: string;
  endIso: string;
} {
  const { year, month } = getBusinessYearMonth(reference);
  const monthPadded = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayPadded = String(lastDay).padStart(2, "0");

  return {
    startIso: `${year}-${monthPadded}-01T00:00:00.000${BUSINESS_UTC_OFFSET}`,
    endIso: `${year}-${monthPadded}-${lastDayPadded}T23:59:59.999${BUSINESS_UTC_OFFSET}`,
  };
}
