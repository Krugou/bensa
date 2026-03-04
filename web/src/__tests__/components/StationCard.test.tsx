import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { StationCard } from '../../components/StationCard';
import { GasStation } from '../../types';

const mockStation: GasStation = {
  id: 'test-001',
  name: 'Test Station',
  brand: 'Test',
  address: 'Test Street 1',
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

  it('renders the station name', () => {
    render(React.createElement(StationCard, defaultProps));
    expect(screen.getByText('Test Station')).toBeInTheDocument();
  });

  it('renders the station address and city', () => {
    render(React.createElement(StationCard, defaultProps));
    expect(screen.getByText('Test Street 1, Helsinki')).toBeInTheDocument();
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
});
