import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useGeolocation } from '../../hooks/useGeolocation';
import { Analytics } from '../../utils/analytics';

describe('useGeolocation', () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  };

  beforeAll(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    });
  });

  it('should initialize with null coords and no error', () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.coords).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle successful location request', async () => {
    const mockPosition = {
      coords: {
        latitude: 60.1695,
        longitude: 24.9354,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => success(mockPosition));

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.coords).toEqual(mockPosition.coords);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(Analytics.trackLocationRequest).toHaveBeenCalledWith(true);
  });

  it('should handle failed location request', async () => {
    const mockError = {
      code: 1,
      message: 'User denied Geolocation',
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => error(mockError));

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.coords).toBeNull();
    expect(result.current.error).toEqual(mockError);
    expect(result.current.loading).toBe(false);
    expect(Analytics.trackLocationRequest).toHaveBeenCalledWith(false);
  });

  it('should handle unsupported geolocation', () => {
    const originalGeolocation = global.navigator.geolocation;
    // @ts-expect-error - overriding for test
    delete global.navigator.geolocation;

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation();
    });

    expect(result.current.error?.message).toBe('Geolocation not supported');
    expect(Analytics.trackLocationRequest).toHaveBeenCalledWith(false);

    // Restore
    Object.defineProperty(global.navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
  });
});
