import { describe, expect, it } from 'vitest';

import { getPriceStats, getStationPrice } from '../../services/priceService';
import { GasStation } from '../../types';

const mockStations: GasStation[] = [
  {
    id: 'station-a',
    name: 'Station A',
    brand: 'A',
    address: 'Addr A',
    city: 'City A',
    lat: 60.0,
    lon: 24.0,
    prices: [
      { type: '95', price: 1.739, updatedAt: '2026-03-04T12:00:00Z' },
      { type: '98', price: 1.849, updatedAt: '2026-03-04T12:00:00Z' },
      { type: 'diesel', price: 1.629, updatedAt: '2026-03-04T12:00:00Z' },
    ],
  },
  {
    id: 'station-b',
    name: 'Station B',
    brand: 'B',
    address: 'Addr B',
    city: 'City B',
    lat: 61.0,
    lon: 25.0,
    prices: [
      { type: '95', price: 1.869, updatedAt: '2026-03-04T12:00:00Z' },
      { type: '98', price: 1.979, updatedAt: '2026-03-04T12:00:00Z' },
      { type: 'diesel', price: 1.759, updatedAt: '2026-03-04T12:00:00Z' },
    ],
  },
];

describe('priceService', () => {
  describe('getPriceStats', () => {
    it('calculates correct stats for 95', () => {
      const stats = getPriceStats(mockStations, '95');
      expect(stats.min).toBe(1.739);
      expect(stats.max).toBe(1.869);
      expect(stats.average).toBe(1.804);
      expect(stats.cheapestStation?.id).toBe('station-a');
    });

    it('calculates correct stats for diesel', () => {
      const stats = getPriceStats(mockStations, 'diesel');
      expect(stats.min).toBe(1.629);
      expect(stats.max).toBe(1.759);
      expect(stats.cheapestStation?.name).toBe('Station A');
    });

    it('returns zeros for empty stations', () => {
      const stats = getPriceStats([], '95');
      expect(stats.average).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.cheapestStation).toBeNull();
    });
  });

  describe('getStationPrice', () => {
    it('returns correct price for fuel type', () => {
      expect(getStationPrice(mockStations[0], '95')).toBe(1.739);
      expect(getStationPrice(mockStations[0], 'diesel')).toBe(1.629);
    });

    it('returns null for missing fuel type', () => {
      const station: GasStation = {
        ...mockStations[0],
        prices: [{ type: '95', price: 1.8, updatedAt: '' }],
      };
      expect(getStationPrice(station, 'diesel')).toBeNull();
    });
  });
});
