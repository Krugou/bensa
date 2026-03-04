import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { LoadingFuel } from '../../components/LoadingFuel';

describe('LoadingFuel', () => {
  it('renders loading text', () => {
    render(React.createElement(LoadingFuel));
    expect(screen.getByText('Fetching fuel prices...')).toBeInTheDocument();
  });

  it('renders fuel pump emoji', () => {
    render(React.createElement(LoadingFuel));
    expect(screen.getByText('⛽')).toBeInTheDocument();
  });

  it('has the loading container ID', () => {
    const { container } = render(React.createElement(LoadingFuel));
    expect(container.querySelector('#loading')).toBeInTheDocument();
  });
});
