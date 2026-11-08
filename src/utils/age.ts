import type { AgeGroup, Guest } from "../types.ts";

export function isBirthDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^(19|20|21)\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return !Number.isNaN(+date) && date.toISOString().slice(0, 10) === value;
}

// February 29 birthdays use February 28 in non-leap years.
export function ageInMonths(birthDate: string, date = new Date()): number {
  if (!isBirthDate(birthDate)) throw new Error("Data de nascimento inválida.");
  const [year, month, day] = birthDate.split("-").map(Number);
  const anniversaryDay = Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
  return (date.getFullYear() - year) * 12 + date.getMonth() + 1 - month - (date.getDate() < anniversaryDay ? 1 : 0);
}

export function ageGroupFromBirth(birthDate: string, date = new Date()): AgeGroup {
  const months = ageInMonths(birthDate, date);
  if (months < 0) throw new Error("O nascimento não pode ser posterior à data da estadia.");
  return months < 12 ? "Puppy" : months < 96 ? "Adult" : "Senior";
}

export function guestAgeGroup(guest: Guest, date = new Date()): AgeGroup {
  return guest.birthDate ? ageGroupFromBirth(guest.birthDate, date) : guest.age;
}
