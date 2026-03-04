import { describe, expect, it, vi } from 'vitest';

import { getCurrentPosition } from '../../services/locationService';

describe('locationService', () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  };

  beforeAll(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    });
  });

  it('should return position on success', async () => {
    const mockPosition = {
      coords: {
        latitude: 60.1695,
        longitude: 24.9354,
        accuracy: 10,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => success(mockPosition));

    const position = await getCurrentPosition();

    expect(position).toEqual({
      lat: 60.1695,
      lon: 24.9354,
      accuracy: 10,
    });
  });

  it('should reject on error', async () => {
    const mockError = new Error('Permission denied');
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => error(mockError));

    await expect(getCurrentPosition()).rejects.toThrow('Permission denied');
  });

  it('should reject if geolocation is not supported', async () => {
    const originalGeolocation = global.navigator.geolocation;
    // @ts-expect-error - overriding for test
    delete global.navigator.geolocation;

    await expect(getCurrentPosition()).rejects.toThrow('Geolocation not supported');

    // Restore
    Object.defineProperty(global.navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
  });
});
