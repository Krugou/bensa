import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// stub out react-leaflet components so we don't try to render a real map
vi.mock('react-leaflet', () => {
  // define prop types to keep eslint happy
  interface MapContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    center?: unknown;
    zoomControl?: boolean;
    attributionControl?: boolean;
  }

  interface SimpleChildrenProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }

  return {
    MapContainer: (props: MapContainerProps) => {
      const { children, center, zoomControl, attributionControl, ...rest } = props;
      // convert center to string safely without using any
      let centerStr = '';
      if (Array.isArray(center)) {
        centerStr = center.join(',');
      } else if (center != null) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        centerStr = String(center);
      }

      // use data- attributes for props we want to inspect in tests
      return (
        <div
          data-testid="map-container"
          data-center={centerStr}
          data-zoomcontrol={zoomControl ? 'true' : 'false'}
          data-attributioncontrol={attributionControl ? 'true' : 'false'}
          {...rest}
        >
          {children}
        </div>
      );
    },
    CircleMarker: ({
      children,
      center,
      radius,
      ...props
    }: SimpleChildrenProps & { center?: unknown; radius?: number }) => (
      <div
        data-testid="circle-marker"
        data-center={JSON.stringify(center)}
        data-radius={radius}
        {...props}
      >
        {children}
      </div>
    ),
    Circle: ({
      children,
      center,
      radius,
      ...props
    }: SimpleChildrenProps & { center?: unknown; radius?: number }) => (
      <div
        data-testid="circle"
        data-center={JSON.stringify(center)}
        data-radius={radius}
        {...props}
      >
        {children}
      </div>
    ),
    Popup: ({ children }: SimpleChildrenProps) => <div data-testid="popup">{children}</div>,
    Tooltip: ({ children }: SimpleChildrenProps) => <div data-testid="tooltip">{children}</div>,
    TileLayer: () => null,
    useMap: () => ({ fitBounds: vi.fn(), setView: vi.fn() }),
  };
});

import { StationMap } from '../../components/StationMap';
import { DEFAULT_LOCATION } from '../../services/locationService';

describe('StationMap', () => {
  it('defaults to Espoo center and hides user marker when hasGps is false', () => {
    const { getByTestId } = render(
      <StationMap stations={[]} fuelType="95" min={0} max={100} hasGps={false} />,
    );

    // marker text should not be rendered
    expect(screen.queryByText(/Your Location/)).not.toBeInTheDocument();

    // zoomControl should be marked false via data attribute
    const map = getByTestId('map-container');
    expect(map).toHaveAttribute('data-zoomcontrol', 'false');

    // center should default to Espoo coordinates (encoded as data attribute)
    expect(map).toHaveAttribute('data-center', `${DEFAULT_LOCATION.lat},${DEFAULT_LOCATION.lon}`);
  });

  it('renders a user location marker and enables controls when hasGps is true', () => {
    const { getByTestId } = render(
      <StationMap stations={[]} fuelType="95" min={0} max={100} hasGps={true} />,
    );

    // marker text should be visible
    expect(screen.getByText(/Your Location/)).toBeInTheDocument();

    const map = getByTestId('map-container');
    // when controls enabled the data attr should say true
    expect(map).toHaveAttribute('data-zoomcontrol', 'true');
  });
});
