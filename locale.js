const locale = 'pt-PT';
const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
const date = new Intl.DateTimeFormat(locale);

export const money = value => currency.format(value);
export const shortMoney = value => new Intl.NumberFormat(locale, {
  style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1,
}).format(value);
export const formatDate = value => date.format(new Date(`${value}T12:00:00`));
export const monthName = (month, short = false) => new Date(2026, month, 1)
  .toLocaleString(locale, { month: short ? 'short' : 'long' });
export const pageLabels = {
  Overview: 'Visão geral',
  Bookings: 'Reservas',
  'Guests & clients': 'Hóspedes e tutores',
  Payments: 'Pagamentos',
  'Pricing & seasons': 'Preços e épocas',
};
// Keep the stored values unchanged so existing guests, bookings and rates still work.
export const ageLabels = { Puppy: 'Cachorro', Adult: 'Adulto', Senior: 'Sénior' };
export const stayLabels = { Boarding: 'Hotel', Daycare: 'Creche' };
export const breedLabel = breed => ({ 'French Bulldog': 'Bulldog francês' }[breed] ?? breed);
