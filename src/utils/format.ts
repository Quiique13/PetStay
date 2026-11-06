export function createFormatters(locale: string) {
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
  const compact = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat(locale);
  return {
    money: (value: number) => currency.format(value),
    shortMoney: (value: number) => compact.format(value),
    formatDate: (value: string) => date.format(new Date(`${value}T12:00:00`)),
    monthName: (month: number, short = false) => new Date(2026, month, 1).toLocaleString(locale, { month: short ? 'short' : 'long' }),
  };
}
export const pageLabels = {
  Overview: 'Visão geral',
  Bookings: 'Reservas',
  'Guests & clients': 'Hóspedes e tutores',
  Payments: 'Pagamentos',
  'Pricing & seasons': 'Preços e épocas',
  Settings: 'Definições',
};
// Keep the stored values unchanged so existing guests, bookings and rates still work.
export const ageLabels = { Puppy: 'Cachorro', Adult: 'Adulto', Senior: 'Sénior' };
export const stayLabels = { Boarding: 'Hotel', Daycare: 'Creche' };
const breedLabels: Record<string, string> = { 'French Bulldog': 'Bulldog francês' };
export const breedLabel = (breed: string, translate: (message: string) => string) => breedLabels[breed] ? translate(breedLabels[breed]) : breed;

export function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return (words[0]?.[0] ?? "") + (words.length > 1 ? words.at(-1)?.[0] ?? "" : "");
}

export function localDate(offset = 0) {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}
