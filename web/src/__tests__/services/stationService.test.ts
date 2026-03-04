import { describe, expect, it } from 'vitest';

import {
  calculateDistance,
  filterByFuelType,
  getNearbyStations,
  sortByPrice,
} from '../../services/stationService';
import { GasStation } from '../../types';

const mockStations: GasStation[] = [
  {
    id: 'far',
    name: 'Far Station',
    brand: 'X',
    address: '',
    city: 'Tampere',
    lat: 61.5,
    lon: 23.7,
    prices: [
      { type: '95', price: 1.80, updatedAt: '' },
      { type: 'diesel', price: 1.70, updatedAt: '' },
    ],
  },
  {
    id: 'near',
    name: 'Near Station',
    brand: 'Y',
    address: '',
    city: 'Helsinki',
    lat: 60.18,
    lon: 24.95,
    prices: [
      { type: '95', price: 1.75, updatedAt: '' },
      { type: 'diesel', price: 1.65, updatedAt: '' },
    ],
  },
];

describe('stationService', () => {
  describe('calculateDistance', () => {
    it('returns 0 for same point', () => {
      expect(calculateDistance(60.0, 24.0, 60.0, 24.0)).toBe(0);
    });

    it('returns correct distance between Helsinki and Tampere', () => {
      const d = calculateDistance(60.17, 24.94, 61.50, 23.79);
      expect(d).toBeGreaterThan(140);
      expect(d).toBeLessThan(170);
    });
  });

  describe('getNearbyStations', () => {
    it('sorts stations by distance from Helsinki', () => {
      const sorted = getNearbyStations(mockStations, 60.17, 24.94);
      expect(sorted[0].id).toBe('near');
      expect(sorted[1].id).toBe('far');
      expect(sorted[0].distance).toBeDefined();
      expect(sorted[0].distance!).toBeLessThan(sorted[1].distance!);
    });
  });

  describe('sortByPrice', () => {
    it('sorts ascending by default', () => {
      const sorted = sortByPrice(mockStations, '95');
      expect(sorted[0].id).toBe('near');
    });

    it('sorts descending when specified', () => {
      const sorted = sortByPrice(mockStations, '95', false);
      expect(sorted[0].id).toBe('far');
    });
  });

  describe('filterByFuelType', () => {
    it('filters stations with the fuel type', () => {
      const filtered = filterByFuelType(mockStations, '98');
      expect(filtered).toHaveLength(0);
    });

    it('returns all stations that have the fuel type', () => {
      const filtered = filterByFuelType(mockStations, '95');
      expect(filtered).toHaveLength(2);
    });
  });
});
