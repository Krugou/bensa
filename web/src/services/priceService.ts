import { collection, getDocs } from 'firebase/firestore';

import { db } from '../firebase';
import { FuelPrice, FuelType, GasStation, PriceStats } from '../types';

const CACHE_KEY = 'bensa_prices_cache';
const CACHE_TIME_KEY = 'bensa_prices_cache_time';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface FirestoreStation {
  name: string;
  brand: string;
  address: string;
  city: string;
  lat: number;
  lon: number;
  prices: FuelPrice[];
  sourceUrl?: string;
  userFixed?: boolean;
}

/**
 * Fetch all gas station prices from Firestore with caching and zero-filtering
 */
export async function fetchPrices(): Promise<GasStation[]> {
  try {
    // 1. Check cache
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (cachedTime && cachedData) {
      const age = Date.now() - parseInt(cachedTime, 10);
      if (age < CACHE_DURATION) {
        console.log('[PriceService] Using cached prices (age:', Math.round(age / 1000), 's)');
        return JSON.parse(cachedData) as GasStation[];
      }
    }

    // 2. Fetch from Firestore
    const stationsCol = collection(db, 'stations');
    const stationSnapshot = await getDocs(stationsCol);

    // 3. Process and filter out zero prices
    const stationList = stationSnapshot.docs.map((d) => {
      const data = d.data() as FirestoreStation;
      // Filter out zero prices from the prices array
      const validPrices = data.prices.filter((p) => p.price > 0);
      return {
        id: d.id,
        ...data,
        prices: validPrices,
      } as GasStation;
    });

    // Only keep stations that have at least one valid price
    const filteredList = stationList.filter((s) => s.prices.length > 0);

    // 4. Update cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(filteredList));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

    return filteredList;
  } catch (error: unknown) {
    console.error('[PriceService] Failed to fetch prices:', error);

    // Specific check for Firestore quota/read limit
    const err = error as { code?: string; message?: string };
    if (err.code === 'resource-exhausted' || err.message?.includes('quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }

    // Return cached data as fallback if available, even if expired
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      console.log('[PriceService] Network failed, using expired cache fallback');
      return JSON.parse(cachedData) as GasStation[];
    }

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
      // Extra safety check for 0
      const price = fuelPrice?.price && fuelPrice.price > 0 ? fuelPrice.price : Infinity;
      return { station, price };
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
  return fuel?.price && fuel.price > 0 ? fuel.price : null;
}
