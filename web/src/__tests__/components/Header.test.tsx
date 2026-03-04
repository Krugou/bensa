import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Header } from '../../components/Header';

describe('Header', () => {
  it('renders the app title', () => {
    render(React.createElement(Header));
    expect(screen.getByText('Bensa')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(React.createElement(Header));
    expect(screen.getByText('Real-time fuel price tracker')).toBeInTheDocument();
  });

  it('renders a header element', () => {
    const { container } = render(React.createElement(Header));
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('has proper heading hierarchy with h1', () => {
    render(React.createElement(Header));
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('renders the fuel pump emoji', () => {
    render(React.createElement(Header));
    expect(screen.getByText('⛽')).toBeInTheDocument();
  });
});
