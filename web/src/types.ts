export type FuelType = '95' | '98' | 'diesel';

export type PriceLevel = 'cheap' | 'mid' | 'expensive';

export interface FuelPrice {
  type: FuelType;
  price: number; // price per liter in EUR
  updatedAt: string; // ISO timestamp
}

export interface GasStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  lat: number;
  lon: number;
  prices: FuelPrice[];
  distance?: number; // km from user, computed client-side
  sourceUrl?: string;
}

export interface PriceStats {
  average: number;
  min: number;
  max: number;
  cheapestStation: GasStation | null;
}
