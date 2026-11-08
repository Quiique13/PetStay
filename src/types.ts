export type AgeGroup = "Puppy" | "Adult" | "Senior";
export type StayType = "Boarding" | "Daycare";
export type Price = number | null;
export type SeasonalPrices = [Price, Price, Price?];

export interface HotelProfile {
  name: string;
  owner: string;
  avatar: string;
}

export interface Guest {
  name: string;
  owner: string;
  breed: string;
  age: AgeGroup;
  birthDate?: string;
  photo?: string;
  neutered?: boolean;
  deceased?: boolean;
}

export interface Booking {
  dog: string;
  start: string;
  end: string;
  type: StayType;
  paid: boolean;
  total: number;
  customTotal?: number;
  customRate?: number;
  discountPercent?: number;
  intactSurcharge?: boolean;
}

export interface SeasonRange {
  /** Inclusive month/day boundaries (MM-DD), repeated every year. */
  start: string;
  end: string;
}

export type Rates = Record<AgeGroup, SeasonalPrices> & {
  day: Price;
  high: SeasonRange[];
  christmas?: SeasonRange[];
};

export interface HotelData {
  hotel: HotelProfile | null;
  rates: Rates;
  guests: Guest[];
  bookings: Booking[];
  occupancy: number;
  capacity: number;
}

export interface StorageSnapshot {
  data: HotelData;
  revision: number;
  initialized: boolean;
}

export interface StorageError extends Error {
  status?: number;
}

export function asStorageError(cause: unknown): StorageError {
  return cause instanceof Error ? cause : new Error(String(cause));
}
