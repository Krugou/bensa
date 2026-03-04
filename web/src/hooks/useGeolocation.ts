import { useState } from 'react';

import { Analytics } from '../utils/analytics';

interface GeolocationState {
  coords: GeolocationCoordinates | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: false,
  });

  const requestLocation = () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!navigator.geolocation) {
      Analytics.trackLocationRequest(false);
      setState((prev) => ({
        ...prev,
        error: {
          code: 0,
          message: 'Geolocation not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        Analytics.trackLocationRequest(true);
        setState({
          coords: position.coords,
          error: null,
          loading: false,
        });
      },
      (error) => {
        Analytics.trackLocationRequest(false);
        setState({
          coords: null,
          error,
          loading: false,
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  return { ...state, requestLocation };
};
