import type { AgeGroup, HotelData, HotelProfile, StayType } from "../types.ts";

export function defaultData(): HotelData {
  return {
    hotel: null,
    rates: { Puppy: [null, null], Adult: [null, null], Senior: [null, null], day: null, high: [] },
    guests: [],
    bookings: [],
    occupancy: 0,
    capacity: 1,
  };
}

export function newHotelData(hotel: HotelProfile | null): HotelData {
  if (!hotel) throw new Error("Preencha o perfil do hotel para começar.");
  return validateData({ ...defaultData(), hotel });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isAgeGroup(value: unknown): value is AgeGroup {
  return value === "Puppy" || value === "Adult" || value === "Senior";
}

export function isStayType(value: unknown): value is StayType {
  return value === "Boarding" || value === "Daycare";
}

function isHotelData(data: unknown): data is HotelData {
  const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 500;
  const amount = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000;
  const price = (value: unknown) => value === null || amount(value);
  const date = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!isRecord(data) || !isRecord(data.rates)) return false;
  if (data.hotel !== null && (!isRecord(data.hotel) || !text(data.hotel.name) || data.hotel.name.length > 100
    || !text(data.hotel.owner) || data.hotel.owner.length > 100
    || typeof data.hotel.avatar !== "string" || (data.hotel.avatar !== ""
      && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(data.hotel.avatar)
        || data.hotel.avatar.length > 1_400_000)))) return false;
  for (const age of ["Puppy", "Adult", "Senior"]) {
    const prices = data.rates[age];
    if (!Array.isArray(prices) || prices.length !== 2 || !prices.every(price)) return false;
  }
  if (!price(data.rates.day) || !Array.isArray(data.rates.high)
    || !data.rates.high.every(month => Number.isInteger(month) && month >= 0 && month <= 11)
    || new Set(data.rates.high).size !== data.rates.high.length) return false;
  if (!Array.isArray(data.guests) || !data.guests.every((guest: unknown) => isRecord(guest)
    && text(guest.name) && text(guest.owner) && text(guest.breed)
    && isAgeGroup(guest.age))) return false;
  if (!Array.isArray(data.bookings) || !data.bookings.every((booking: unknown) => isRecord(booking)
    && text(booking.dog) && date(booking.start) && date(booking.end)
    && isStayType(booking.type)
    && (booking.type === "Daycare" ? booking.end === booking.start : booking.end > booking.start)
    && typeof booking.paid === "boolean" && amount(booking.total))) return false;
  if (typeof data.capacity !== "number" || !Number.isInteger(data.capacity) || data.capacity < 1 || data.capacity > 100
    || typeof data.occupancy !== "number" || !Number.isFinite(data.occupancy) || data.occupancy < 0 || data.occupancy > 100) return false;
  return true;
}

export function validateData(data: unknown): HotelData {
  if (!isHotelData(data)) throw new Error("Os dados têm um formato inválido. Nenhuma alteração foi gravada.");
  return data;
}

export function bookingPrice(data: HotelData, dog: string, start: string, end: string, type: StayType): number {
  const guest = data.guests.find(item => item.name === dog);
  if (!guest) throw new Error("Adicione e selecione um hóspede antes de criar a reserva.");
  if (type === "Daycare") {
    if (data.rates.day === null) throw new Error("Defina o preço diário da creche em Preços e épocas antes de criar esta reserva.");
    return data.rates.day;
  }
  let total = 0;
  const day = new Date(start + "T12:00:00"), last = new Date(end + "T12:00:00");
  if (Number.isNaN(+day) || Number.isNaN(+last) || last <= day) {
    throw new Error("A data de saída deve ser posterior à data de entrada.");
  }
  while (day < last) {
    const rate = data.rates[guest.age][data.rates.high.includes(day.getMonth()) ? 1 : 0];
    if (rate === null) throw new Error("Defina o preço de hotel para a faixa etária e época desta estadia em Preços e épocas.");
    total += rate;
    day.setDate(day.getDate() + 1);
  }
  return Math.round((total + Number.EPSILON) * 100) / 100;
}
