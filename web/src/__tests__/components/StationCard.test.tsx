import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { StationCard } from '../../components/StationCard';
import { GasStation } from '../../types';

const mockStation: GasStation = {
  id: 'test-001',
  name: 'Neste, Laajasalo Kuvernöörintie 6',
  brand: 'Neste',
  address: 'Neste, Laajasalo Kuvernöörintie 6',
  city: 'Helsinki',
  lat: 60.17,
  lon: 24.94,
  distance: 2.5,
  prices: [
    { type: '95', price: 1.799, updatedAt: '2026-03-04T15:00:00Z' },
    { type: '98', price: 1.899, updatedAt: '2026-03-04T15:00:00Z' },
    { type: 'diesel', price: 1.679, updatedAt: '2026-03-04T15:00:00Z' },
  ],
};

describe('StationCard', () => {
  const defaultProps = {
    station: mockStation,
    fuelType: '95' as const,
    min: 1.739,
    max: 1.869,
    rank: 1,
  };

  it('renders the cleaned station name (without brand prefix)', () => {
    render(React.createElement(StationCard, defaultProps));
    // Should show cleaned name without "Neste," prefix
    expect(screen.getByText('Laajasalo Kuvernöörintie 6')).toBeInTheDocument();
  });

  it('renders a non-redundant address when address duplicates name', () => {
    render(React.createElement(StationCard, defaultProps));
    // Address should be extracted street, not the full raw name
    expect(screen.getByText(/Kuvernöörintie 6, Helsinki/)).toBeInTheDocument();
  });

  it('renders the fuel price', () => {
    render(React.createElement(StationCard, defaultProps));
    expect(screen.getByText('1.799')).toBeInTheDocument();
  });

  it('renders the distance', () => {
    render(React.createElement(StationCard, defaultProps));
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });

  it('renders the rank badge', () => {
    render(React.createElement(StationCard, defaultProps));
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('has the correct card ID', () => {
    const { container } = render(React.createElement(StationCard, defaultProps));
    expect(container.querySelector('#station-test-001')).toBeInTheDocument();
  });

  it('strips technical annotations from station name', () => {
    const stationWithAnnotation: GasStation = {
      ...mockStation,
      name: 'Shell, Leppävaara Vanha maantie 2 (*E99+)',
      brand: 'Shell',
      address: 'Shell, Leppävaara Vanha maantie 2 (*E99+)',
    };
    render(
      React.createElement(StationCard, {
        ...defaultProps,
        station: stationWithAnnotation,
      }),
    );
    expect(screen.getByText('Leppävaara Vanha maantie 2')).toBeInTheDocument();
  });
});
