import { FuelType, PriceLevel } from '../types';

/**
 * Determine the price level based on the price relative to min/max range
 */
export function getPriceLevel(price: number, min: number, max: number): PriceLevel {
  const range = max - min;
  if (range === 0) return 'mid';
  const normalized = (price - min) / range;
  if (normalized <= 0.33) return 'cheap';
  if (normalized <= 0.66) return 'mid';
  return 'expensive';
}

/**
 * Get the glow color for a price level
 */
export function getPriceLevelColor(level: PriceLevel): string {
  switch (level) {
    case 'cheap':
      return '#00ff88';
    case 'mid':
      return '#ffd700';
    case 'expensive':
      return '#ff4444';
  }
}

/**
 * Get a CSS class name for the price level
 */
export function getPriceLevelClass(level: PriceLevel): string {
  switch (level) {
    case 'cheap':
      return 'text-fuel-green';
    case 'mid':
      return 'text-fuel-yellow';
    case 'expensive':
      return 'text-fuel-red';
  }
}

/**
 * Get a CSS glow class for the price level
 */
export function getPriceLevelGlow(level: PriceLevel): string {
  switch (level) {
    case 'cheap':
      return 'text-glow';
    case 'mid':
      return 'text-glow-yellow';
    case 'expensive':
      return 'text-glow-red';
  }
}

/**
 * Constant for liters per US gallon
 */
export const LITERS_PER_GALLON = 3.78541;

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return price.toFixed(3);
}

/**
 * Format price per gallon for display
 */
export function formatPricePerGallon(pricePerLiter: number): string {
  return (pricePerLiter * LITERS_PER_GALLON).toFixed(2);
}

/**
 * Get a human-readable fuel type label
 */
export function getFuelTypeLabel(fuelType: FuelType): string {
  switch (fuelType) {
    case '95':
      return '95E10';
    case '98':
      return '98E5';
    case 'diesel':
      return 'Diesel';
    case 're85':
      return 'RE85';
  }
}

/**
 * Get the emoji for a fuel type
 */
export function getFuelTypeEmoji(fuelType: FuelType): string {
  switch (fuelType) {
    case '95':
      return '⛽';
    case '98':
      return '🏎️';
    case 'diesel':
      return '🚛';
    case 're85':
      return '🌽';
  }
}

/**
 * Get the Google Maps directions URL for a station
 */
export function getDirectionsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

/**
 * Interpolate color between green/yellow/red based on normalized value (0 = cheap, 1 = expensive)
 */
export function interpolatePriceColor(normalizedPrice: number): string {
  const clamped = Math.max(0, Math.min(1, normalizedPrice));

  if (clamped <= 0.5) {
    // Green to Yellow
    const t = clamped * 2;
    const r = Math.round(t * 255);
    const g = Math.round(255 - t * 40);
    const b = Math.round((1 - t) * 136);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to Red
    const t = (clamped - 0.5) * 2;
    const r = 255;
    const g = Math.round(215 - t * 215);
    const b = Math.round(t * 68);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
