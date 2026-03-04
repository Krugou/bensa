import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StationList } from '../../components/StationList';
import { GasStation } from '../../types';

// Mock StationCard to avoid rendering complex nested logic if it's currently broken
vi.mock('../../components/StationCard', () => ({
  StationCard: ({ station, rank }: { station: GasStation; rank: number }) => (
    <div data-testid="station-card">
      {rank}. {station.name}
    </div>
  ),
}));

describe('StationList', () => {
  const mockStations: GasStation[] = [
    {
      id: '1',
      name: 'Station 1',
      brand: 'ABC',
      address: 'Address 1',
      city: 'City',
      prices: [{ type: '95', price: 1.8, updatedAt: '' }],
      lat: 0,
      lon: 0,
    },
    {
      id: '2',
      name: 'Station 2',
      brand: 'XYZ',
      address: 'Address 2',
      city: 'City',
      prices: [{ type: '95', price: 1.7, updatedAt: '' }],
      lat: 0,
      lon: 0,
    },
  ];

  it('should render empty message when no stations', () => {
    render(<StationList stations={[]} fuelType="95" min={1.7} max={1.8} />);
    expect(screen.getByText('No stations found')).toBeDefined();
  });

  it('should render list of station cards', () => {
    render(<StationList stations={mockStations} fuelType="95" min={1.7} max={1.8} />);

    expect(screen.getByText('2 stations')).toBeDefined();

    const cards = screen.getAllByTestId('station-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('1. Station 1');
    expect(cards[1].textContent).toContain('2. Station 2');
  });
});
