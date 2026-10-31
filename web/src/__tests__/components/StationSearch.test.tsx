import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { StationSearch } from '../../components/StationSearch';

describe('StationSearch', () => {
  it('updates the query and offers an accessible clear action', () => {
    const onChange = vi.fn();
    render(React.createElement(StationSearch, { query: 'Helsinki', onChange }));

    const input = screen.getByRole('searchbox', { name: 'Search stations' });
    fireEvent.change(input, { target: { value: 'Espoo' } });
    expect(onChange).toHaveBeenLastCalledWith('Espoo');

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('hides the clear action when the search is empty', () => {
    render(React.createElement(StationSearch, { query: '', onChange: vi.fn() }));
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });
});
