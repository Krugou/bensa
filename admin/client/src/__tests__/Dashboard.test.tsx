import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../../src/components/Dashboard';
import React from 'react';

// Mock Firebase
vi.mock('../../src/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  getDocs: vi.fn(() => Promise.resolve({ 
    size: 10, 
    docs: [{ data: () => ({ userFixed: true }) }] 
  })),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

describe('Dashboard', () => {
  it('renders stats correctly', async () => {
    render(<Dashboard />);
    
    // Wait for loading to finish
    const totalStations = await screen.findByText('Total Stations');
    expect(totalStations).toBeInTheDocument();
    
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
