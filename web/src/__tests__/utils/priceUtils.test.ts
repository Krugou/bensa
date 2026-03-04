import { describe, expect, it } from 'vitest';

import {
  formatPrice,
  getFuelTypeEmoji,
  getFuelTypeLabel,
  getPriceLevel,
  getPriceLevelClass,
  getPriceLevelColor,
  interpolatePriceColor,
} from '../../utils/priceUtils';

describe('priceUtils', () => {
  describe('getPriceLevel', () => {
    it('returns cheap for low prices', () => {
      expect(getPriceLevel(1.74, 1.73, 1.87)).toBe('cheap');
    });

    it('returns mid for middle prices', () => {
      expect(getPriceLevel(1.80, 1.73, 1.87)).toBe('mid');
    });

    it('returns expensive for high prices', () => {
      expect(getPriceLevel(1.86, 1.73, 1.87)).toBe('expensive');
    });

    it('returns mid when min equals max', () => {
      expect(getPriceLevel(1.80, 1.80, 1.80)).toBe('mid');
    });
  });

  describe('getPriceLevelColor', () => {
    it('returns green for cheap', () => {
      expect(getPriceLevelColor('cheap')).toBe('#00ff88');
    });

    it('returns yellow for mid', () => {
      expect(getPriceLevelColor('mid')).toBe('#ffd700');
    });

    it('returns red for expensive', () => {
      expect(getPriceLevelColor('expensive')).toBe('#ff4444');
    });
  });

  describe('getPriceLevelClass', () => {
    it('returns correct class for each level', () => {
      expect(getPriceLevelClass('cheap')).toBe('text-fuel-green');
      expect(getPriceLevelClass('mid')).toBe('text-fuel-yellow');
      expect(getPriceLevelClass('expensive')).toBe('text-fuel-red');
    });
  });

  describe('formatPrice', () => {
    it('formats price to 3 decimal places', () => {
      expect(formatPrice(1.8)).toBe('1.800');
      expect(formatPrice(1.829)).toBe('1.829');
      expect(formatPrice(1.7)).toBe('1.700');
    });
  });

  describe('getFuelTypeLabel', () => {
    it('returns correct labels', () => {
      expect(getFuelTypeLabel('95')).toBe('95E10');
      expect(getFuelTypeLabel('98')).toBe('98E5');
      expect(getFuelTypeLabel('diesel')).toBe('Diesel');
    });
  });

  describe('getFuelTypeEmoji', () => {
    it('returns correct emojis', () => {
      expect(getFuelTypeEmoji('95')).toBe('⛽');
      expect(getFuelTypeEmoji('98')).toBe('🏎️');
      expect(getFuelTypeEmoji('diesel')).toBe('🚛');
    });
  });

  describe('interpolatePriceColor', () => {
    it('returns greenish for 0', () => {
      const color = interpolatePriceColor(0);
      expect(color).toMatch(/^rgb\(/);
    });

    it('returns reddish for 1', () => {
      const color = interpolatePriceColor(1);
      expect(color).toContain('255');
    });

    it('clamps values outside 0-1', () => {
      const color1 = interpolatePriceColor(-0.5);
      const color2 = interpolatePriceColor(0);
      expect(color1).toBe(color2);
    });
  });
});
