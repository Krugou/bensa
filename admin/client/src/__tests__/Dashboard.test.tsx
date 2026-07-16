import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../../src/components/Dashboard';
import React from 'react';
import axios from 'axios';

vi.mock('axios');

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': 'System Overview',
        'dashboard.totalStations': 'Total Stations',
      };
      return translations[key] || key;
    },
  }),
}));

describe('Dashboard', () => {
  it('renders stats correctly', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        totalStations: 10,
        lockedStations: 1,
        lastScraperRun: null,
      },
    });

    render(<Dashboard />);

    // Wait for loading to finish
    const totalStations = await screen.findByText('Total Stations');
    expect(totalStations).toBeInTheDocument();

    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
