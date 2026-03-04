import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FuelTypeSelector } from '../../components/FuelTypeSelector';

describe('FuelTypeSelector', () => {
  it('renders all three fuel type buttons', () => {
    render(React.createElement(FuelTypeSelector, { selected: '95', onChange: vi.fn() }));
    expect(screen.getByText('95E10', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('98E5', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Diesel', { exact: false })).toBeInTheDocument();
  });

  it('calls onChange when a fuel type is clicked', () => {
    const onChange = vi.fn();
    render(React.createElement(FuelTypeSelector, { selected: '95', onChange }));
    fireEvent.click(screen.getByText('Diesel', { exact: false }));
    expect(onChange).toHaveBeenCalledWith('diesel');
  });

  it('has the correct container ID', () => {
    const { container } = render(
      React.createElement(FuelTypeSelector, { selected: '95', onChange: vi.fn() }),
    );
    expect(container.querySelector('#fuel-type-selector')).toBeInTheDocument();
  });
});
