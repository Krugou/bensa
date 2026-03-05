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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
        reject(new Error(error.message));
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
 * Default location (Espoo city center) when geolocation is unavailable
 */
export const DEFAULT_LOCATION: UserLocation = {
  lat: 60.2055,
  lon: 24.6559,
  accuracy: 0,
};
