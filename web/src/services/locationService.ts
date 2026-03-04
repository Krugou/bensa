/**
 * Location service — wraps browser geolocation API
 */

export interface UserLocation {
  lat: number;
  lon: number;
  accuracy: number;
}

/**
 * Get user's current position
 */
export function getCurrentPosition(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      },
    );
  });
}

/**
 * Default location (Helsinki city center) when geolocation is unavailable
 */
export const DEFAULT_LOCATION: UserLocation = {
  lat: 60.1699,
  lon: 24.9384,
  accuracy: 0,
};
