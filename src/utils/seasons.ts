import type { AgeGroup, Rates, SeasonRange } from "../types.ts";

// A leap year keeps February 29 available for recurring seasons.
export function daysInSeasonMonth(month: number): number {
  return new Date(2000, month, 0).getDate();
}

export function isSeasonDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}-\d{2}$/.test(value)) return false;
  const [month, day] = value.split("-").map(Number);
  return (
    month >= 1 && month <= 12 && day >= 1 && day <= daysInSeasonMonth(month)
  );
}

function inRanges(ranges: SeasonRange[], date: Date): boolean {
  const day = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return ranges.some(({ start, end }) =>
    start <= end ? day >= start && day <= end : day >= start || day <= end,
  );
}

export function isHighSeason(rates: Rates, date: Date): boolean {
  return inRanges(rates.high, date);
}

export function nightlyRate(rates: Rates, age: AgeGroup, date: Date) {
  return inRanges(rates.christmas ?? [], date)
    ? (rates[age][2] ?? null)
    : rates[age][isHighSeason(rates, date) ? 1 : 0];
}

export function monthlyRevenue(
  rates: Rates,
  year: number,
  month: number,
  capacity: number,
  occupancy: number,
): number | null {
  let total = 0;
  const days = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= days; day++) {
    const rate = nightlyRate(rates, "Adult", new Date(year, month, day, 12));
    if (rate === null) return null;
    total += rate;
  }
  return Math.round((total * capacity * occupancy) / 100);
}
