import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CitySelector } from '../../components/CitySelector';

describe('CitySelector', () => {
  it('renders the all-cities option and available cities', () => {
    render(
      React.createElement(CitySelector, {
        cities: ['Espoo', 'Helsinki'],
        selectedCity: null,
        onChange: vi.fn(),
      }),
    );

    expect(screen.getByRole('option', { name: 'All Cities' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Espoo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Helsinki' })).toBeInTheDocument();
  });

  it('reports the selected city and clears the filter for all cities', () => {
    const onChange = vi.fn();
    render(
      React.createElement(CitySelector, {
        cities: ['Espoo', 'Helsinki'],
        selectedCity: null,
        onChange,
      }),
    );

    const selector = screen.getByRole('combobox', { name: 'Filter by city' });
    fireEvent.change(selector, { target: { value: 'Helsinki' } });
    expect(onChange).toHaveBeenLastCalledWith('Helsinki');

    fireEvent.change(selector, { target: { value: 'all' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
