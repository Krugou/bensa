import { FuelType, GasStation } from '../types';

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Get stations sorted by distance from user location
 */
export function getNearbyStations(
  stations: GasStation[],
  userLat: number,
  userLon: number,
): GasStation[] {
  return stations
    .map((station) => ({
      ...station,
      distance: calculateDistance(userLat, userLon, station.lat, station.lon),
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

/**
 * Sort stations by price for a specific fuel type
 */
export function sortByPrice(
  stations: GasStation[],
  fuelType: FuelType,
  ascending = true,
): GasStation[] {
  return [...stations].sort((a, b) => {
    const priceA = a.prices.find((p) => p.type === fuelType)?.price ?? Infinity;
    const priceB = b.prices.find((p) => p.type === fuelType)?.price ?? Infinity;
    return ascending ? priceA - priceB : priceB - priceA;
  });
}

/**
 * Filter stations by fuel type (only those that have the specified type)
 */
export function filterByFuelType(stations: GasStation[], fuelType: FuelType): GasStation[] {
  return stations.filter((s) => s.prices.some((p) => p.type === fuelType));
}

/**
 * Get unique cities from the station list
 */
export function getUniqueCities(stations: GasStation[]): string[] {
  return [...new Set(stations.map((s) => s.city))].sort();
}
