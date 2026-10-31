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
    .filter((s) => s.lat !== 0 && s.lon !== 0 && !!s.lat && !!s.lon)
    .map((station) => ({
      ...station,
      distance: calculateDistance(userLat, userLon, station.lat, station.lon),
    }))
    .sort((a, b) => a.distance - b.distance);
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
 * Filter stations by city. A null city leaves the station list unchanged.
 */
export function filterByCity(stations: GasStation[], city: string | null): GasStation[] {
  return city === null ? stations : stations.filter((station) => station.city === city);
}

/**
 * Search station details without depending on case or diacritic differences.
 */
export function searchStations(stations: GasStation[], searchTerm: string): GasStation[] {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase();
  const terms = normalize(searchTerm.trim()).split(/\s+/).filter(Boolean);

  if (terms.length === 0) return stations;

  return stations.filter((station) => {
    const searchableText = normalize(
      [station.name, station.brand, station.address, station.city].join(' '),
    );
    return terms.every((term) => searchableText.includes(term));
  });
}

/**
 * Get unique cities from the station list
 */
export function getUniqueCities(stations: GasStation[]): string[] {
  return [...new Set(stations.map((s) => s.city))].sort();
}
