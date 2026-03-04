import { FuelType, GasStation, PriceStats } from '../types';

interface PriceApiResponse {
  lastUpdated: string;
  stations: GasStation[];
}

const BASE_URL = import.meta.env.BASE_URL || '/';

/**
 * Fetch all gas station prices from the API
 */
export async function fetchPrices(): Promise<GasStation[]> {
  try {
    const response = await fetch(`${BASE_URL}api/prices.json?t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: PriceApiResponse = await response.json();
    return data.stations;
  } catch (error) {
    console.error('[PriceService] Failed to fetch prices:', error);
    return [];
  }
}

/**
 * Get price statistics for a specific fuel type
 */
export function getPriceStats(stations: GasStation[], fuelType: FuelType): PriceStats {
  const prices = stations
    .map((station) => {
      const fuelPrice = station.prices.find((p) => p.type === fuelType);
      return { station, price: fuelPrice?.price ?? Infinity };
    })
    .filter((p) => p.price !== Infinity);

  if (prices.length === 0) {
    return { average: 0, min: 0, max: 0, cheapestStation: null };
  }

  const values = prices.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const cheapest = prices.find((p) => p.price === min);

  return {
    average: Math.round(average * 1000) / 1000,
    min,
    max,
    cheapestStation: cheapest?.station ?? null,
  };
}

/**
 * Get the price of a specific fuel type from a station
 */
export function getStationPrice(station: GasStation, fuelType: FuelType): number | null {
  const fuel = station.prices.find((p) => p.type === fuelType);
  return fuel?.price ?? null;
}
