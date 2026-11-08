import type { AgeGroup, HotelData, HotelProfile, StayType } from "../types.ts";
import { daysInSeasonMonth, isSeasonDate, nightlyRate } from "./seasons.ts";
import { ageInMonths, guestAgeGroup, isBirthDate } from "./age.ts";

export function defaultData(): HotelData {
  return {
    hotel: null,
    rates: {
      Puppy: [null, null],
      Adult: [null, null],
      Senior: [null, null],
      day: null,
      high: [],
    },
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
  const text = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0 && value.length <= 500;
  const amount = (value: unknown) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1_000_000;
  const price = (value: unknown) => value === null || amount(value);
  const date = (value: unknown): value is string =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (!isRecord(data) || !isRecord(data.rates)) return false;
  if (
    data.hotel !== null &&
    (!isRecord(data.hotel) ||
      !text(data.hotel.name) ||
      data.hotel.name.length > 100 ||
      !text(data.hotel.owner) ||
      data.hotel.owner.length > 100 ||
      typeof data.hotel.avatar !== "string" ||
      (data.hotel.avatar !== "" &&
        (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(
          data.hotel.avatar,
        ) ||
          data.hotel.avatar.length > 1_400_000)))
  )
    return false;
  for (const age of ["Puppy", "Adult", "Senior"]) {
    const prices = data.rates[age];
    if (
      !Array.isArray(prices) ||
      (prices.length !== 2 && prices.length !== 3) ||
      !prices.every(price)
    )
      return false;
  }
  if (
    !price(data.rates.day) ||
    !Array.isArray(data.rates.high) ||
    !data.rates.high.every(
      (range) =>
        isRecord(range) && isSeasonDate(range.start) && isSeasonDate(range.end),
    )
  )
    return false;
  if (
    data.rates.christmas !== undefined &&
    (!Array.isArray(data.rates.christmas) ||
      !data.rates.christmas.every(
        (range) =>
          isRecord(range) &&
          isSeasonDate(range.start) &&
          isSeasonDate(range.end),
      ))
  )
    return false;
  const image = (v: unknown) =>
    v === undefined ||
    v === "" ||
    (typeof v === "string" &&
      v.length <= 1_400_000 &&
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(v));
  if (
    !Array.isArray(data.guests) ||
    !data.guests.every(
      (guest: unknown) =>
        isRecord(guest) &&
        text(guest.name) &&
        text(guest.owner) &&
        text(guest.breed) &&
        isAgeGroup(guest.age) &&
        (guest.birthDate === undefined || (isBirthDate(guest.birthDate) && ageInMonths(guest.birthDate) >= 0)) &&
        image(guest.photo) &&
        (guest.neutered === undefined || typeof guest.neutered === "boolean") &&
        (guest.deceased === undefined || typeof guest.deceased === "boolean"),
    )
  )
    return false;
  if (
    !Array.isArray(data.bookings) ||
    !data.bookings.every(
      (booking: unknown) =>
        isRecord(booking) &&
        text(booking.dog) &&
        date(booking.start) &&
        date(booking.end) &&
        isStayType(booking.type) &&
        (booking.type === "Daycare"
          ? booking.end === booking.start
          : booking.end > booking.start) &&
        typeof booking.paid === "boolean" &&
        amount(booking.total) &&
        (booking.customTotal === undefined || amount(booking.customTotal)) &&
        (booking.customRate === undefined || amount(booking.customRate)) &&
        !(booking.customTotal !== undefined && booking.customRate !== undefined) &&
        (booking.discountPercent === undefined || (typeof booking.discountPercent === "number" && Number.isFinite(booking.discountPercent) && booking.discountPercent >= 0 && booking.discountPercent <= 100)) &&
        (booking.intactSurcharge === undefined ||
          typeof booking.intactSurcharge === "boolean"),
    )
  )
    return false;
  if (
    typeof data.capacity !== "number" ||
    !Number.isInteger(data.capacity) ||
    data.capacity < 1 ||
    data.capacity > 100 ||
    typeof data.occupancy !== "number" ||
    !Number.isFinite(data.occupancy) ||
    data.occupancy < 0 ||
    data.occupancy > 100
  )
    return false;
  return true;
}

export function validateData(data: unknown): HotelData {
  // Existing device files and backups stored zero-based high-season months.
  if (
    isRecord(data) &&
    isRecord(data.rates) &&
    Array.isArray(data.rates.high) &&
    data.rates.high.length > 0 &&
    data.rates.high.every(
      (month) => Number.isInteger(month) && month >= 0 && month <= 11,
    ) &&
    new Set(data.rates.high).size === data.rates.high.length
  ) {
    data = {
      ...data,
      rates: {
        ...data.rates,
        high: data.rates.high.map((month: number) => ({
          start: `${String(month + 1).padStart(2, "0")}-01`,
          end: `${String(month + 1).padStart(2, "0")}-${daysInSeasonMonth(month + 1)}`,
        })),
      },
    };
  }
  if (!isHotelData(data))
    throw new Error(
      "Os dados têm um formato inválido. Nenhuma alteração foi gravada.",
    );
  return data;
}

export function bookingPrice(
  data: HotelData,
  dog: string,
  start: string,
  end: string,
  type: StayType,
  options: { customTotal?: number; customRate?: number; discountPercent?: number; intactSurcharge?: boolean } = {},
): number {
  const guest = data.guests.find((item) => item.name === dog);
  if (!guest)
    throw new Error(
      "Adicione e selecione um hóspede antes de criar a reserva.",
    );
  const first = new Date(start + "T12:00:00"),
    checkout = new Date(end + "T12:00:00");
  if (
    Number.isNaN(+first) ||
    (type === "Boarding" && (Number.isNaN(+checkout) || checkout <= first))
  )
    throw new Error("A data de saída deve ser posterior à data de entrada.");
  guestAgeGroup(guest, first);
  const discount = options.discountPercent ?? 0;
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) throw new Error("O desconto deve estar entre 0 e 100%.");
  if (options.customRate !== undefined && (!Number.isFinite(options.customRate) || options.customRate < 0 || options.customRate > 1_000_000)) throw new Error("Preço personalizado inválido.");
  if (options.customRate !== undefined && options.customTotal !== undefined) throw new Error("Escolha apenas um tipo de preço personalizado.");
  const discounted = (total: number) => Math.round((total * (1 - discount / 100) + Number.EPSILON) * 100) / 100;
  if (options.customTotal !== undefined) {
    if (
      !Number.isFinite(options.customTotal) ||
      options.customTotal < 0 ||
      options.customTotal > 1_000_000
    )
      throw new Error("Preço personalizado inválido.");
    return discounted(options.customTotal);
  }
  const extra = options.intactSurcharge && guest.neutered === false ? 2 : 0;
  if (type === "Daycare") {
    const rate = options.customRate ?? data.rates.day;
    if (rate === null)
      throw new Error(
        "Defina o preço diário da creche em Preços e épocas antes de criar esta reserva.",
      );
    return discounted(rate + extra);
  }
  let total = 0;
  const day = new Date(start + "T12:00:00"),
    last = new Date(end + "T12:00:00");
  if (Number.isNaN(+day) || Number.isNaN(+last) || last <= day) {
    throw new Error("A data de saída deve ser posterior à data de entrada.");
  }
  while (day < last) {
    const rate = options.customRate ?? nightlyRate(data.rates, guestAgeGroup(guest, day), day);
    if (rate === null)
      throw new Error(
        "Defina o preço de hotel para a faixa etária e época desta estadia em Preços e épocas.",
      );
    total += rate + extra;
    day.setDate(day.getDate() + 1);
  }
  return discounted(total);
}
