import { useEffect, useRef, useState } from 'react';

import { FuelType, GasStation } from '../types';

/**
 * Monitors prices and detects when prices drop below a threshold.
 * Returns true when a "price drop" is detected.
 */
export function usePriceAlert(
  stations: GasStation[],
  fuelType: FuelType,
  threshold = 1.75,
): boolean {
  const [isAlert, setIsAlert] = useState(false);
  const prevMinRef = useRef<number | null>(null);

  useEffect(() => {
    if (stations.length === 0) return undefined;

    const prices = stations
      .map((s) => s.prices.find((p) => p.type === fuelType)?.price)
      .filter((p): p is number => p !== undefined);

    if (prices.length === 0) return undefined;

    const currentMin = Math.min(...prices);
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Alert if price drops below threshold OR drops from previous check
    if (currentMin < threshold) {
      if (prevMinRef.current === null || currentMin < prevMinRef.current) {
        setIsAlert(true);
        // Reset alert after 10 seconds
        timer = setTimeout(() => {
          setIsAlert(false);
        }, 10000);
      }
    } else {
      setIsAlert(false);
    }

    prevMinRef.current = currentMin;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [stations, fuelType, threshold]);

  return isAlert;
}
