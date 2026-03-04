import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePriceAlert } from '../../hooks/usePriceAlert';
import { GasStation } from '../../types';

describe('usePriceAlert', () => {
  const mockStations: GasStation[] = [
    {
      id: '1',
      name: 'Station 1',
      brand: 'ABC',
      address: 'Address 1',
      city: 'City',
      prices: [{ type: '95', price: 1.8, updatedAt: '2023-01-01' }],
      lat: 0,
      lon: 0,
    },
    {
      id: '2',
      name: 'Station 2',
      brand: 'XYZ',
      address: 'Address 2',
      city: 'City',
      prices: [{ type: '95', price: 1.7, updatedAt: '2023-01-01' }],
      lat: 0,
      lon: 0,
    },
  ];

  it('should initialize with false alert state', () => {
    const { result } = renderHook(() => usePriceAlert([], '95'));
    expect(result.current).toBe(false);
  });

  it('should set alert when price is below threshold', () => {
    const { result } = renderHook(() => usePriceAlert(mockStations, '95', 1.75));
    // 1.7 < 1.75
    expect(result.current).toBe(true);
  });

  it('should not set alert when price is above threshold', () => {
    const { result } = renderHook(() => usePriceAlert(mockStations, '95', 1.6));
    // 1.7 > 1.6
    expect(result.current).toBe(false);
  });

  it('should reset alert after timeout', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePriceAlert(mockStations, '95', 1.75));

    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(11000);
    });
    expect(result.current).toBe(false);

    vi.useRealTimers();
  });

  it('should set alert when price drops from previous value', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ stations }) => usePriceAlert(stations, '95', 1.75), {
      initialProps: {
        stations: [
          { ...mockStations[0], prices: [{ type: '95', price: 1.74, updatedAt: '' }] },
        ] as GasStation[],
      },
    });

    expect(result.current).toBe(true);

    // Clear alert by waiting
    act(() => {
      vi.advanceTimersByTime(11000);
    });
    expect(result.current).toBe(false);

    // Now drop price further
    rerender({
      stations: [{ ...mockStations[0], prices: [{ type: '95', price: 1.7, updatedAt: '' }] }],
    });

    expect(result.current).toBe(true);
    vi.useRealTimers();
  });
});
