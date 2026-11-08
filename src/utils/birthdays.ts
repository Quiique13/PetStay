import type { Guest } from "../types.ts";

export function birthdayAlerts(guests: Guest[], now = new Date()) {
  return ([0, 1] as const).flatMap(daysAway => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAway, 12);
    return birthdaysInMonth(guests, date.getFullYear(), date.getMonth())
      .filter(birthday => birthday.day === date.getDate())
      .map(birthday => ({ ...birthday, daysAway }));
  });
}

export function birthdaysInMonth(guests: Guest[], year: number, month: number) {
  return guests.flatMap(guest => {
    if (!guest.birthDate || guest.deceased) return [];
    const [birthYear, birthMonth, birthDay] = guest.birthDate.split("-").map(Number);
    if (birthMonth !== month + 1 || year < birthYear) return [];
    const day = Math.min(birthDay, new Date(year, month + 1, 0).getDate());
    return [{ guest, day, age: year - birthYear }];
  }).sort((a, b) => a.day - b.day || a.guest.name.localeCompare(b.guest.name));
}
