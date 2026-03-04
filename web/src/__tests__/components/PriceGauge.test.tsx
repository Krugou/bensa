import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { PriceGauge } from '../../components/PriceGauge';

describe('PriceGauge', () => {
  const defaultProps = {
    average: 1.799,
    min: 1.739,
    max: 1.869,
    fuelTypeLabel: '95E10',
  };

  it('renders the average price', () => {
    render(React.createElement(PriceGauge, defaultProps));
    expect(screen.getByText('1.799')).toBeInTheDocument();
  });

  it('renders the fuel type label', () => {
    render(React.createElement(PriceGauge, defaultProps));
    expect(screen.getByText('95E10')).toBeInTheDocument();
  });

  it('renders min and max prices', () => {
    render(React.createElement(PriceGauge, defaultProps));
    expect(screen.getByText('1.739')).toBeInTheDocument();
    expect(screen.getByText('1.869')).toBeInTheDocument();
  });

  it('renders the €/L unit', () => {
    render(React.createElement(PriceGauge, defaultProps));
    expect(screen.getByText('€/L')).toBeInTheDocument();
  });

  it('has the gauge container ID', () => {
    const { container } = render(React.createElement(PriceGauge, defaultProps));
    expect(container.querySelector('#price-gauge')).toBeInTheDocument();
  });

  it('shows cheap level for low prices', () => {
    const props = { ...defaultProps, average: 1.740, min: 1.739, max: 1.869 };
    render(React.createElement(PriceGauge, props));
    expect(screen.getByText('🟢 Cheap')).toBeInTheDocument();
  });

  it('shows expensive level for high prices', () => {
    const props = { ...defaultProps, average: 1.860, min: 1.739, max: 1.869 };
    render(React.createElement(PriceGauge, props));
    expect(screen.getByText('🔴 Expensive')).toBeInTheDocument();
  });
});
