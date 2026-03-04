import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeToggle } from '../../components/ThemeToggle';
import { ThemeProvider } from '../../context/ThemeProvider';
import { Analytics } from '../../utils/analytics';

describe('ThemeToggle', () => {
  it('should toggle theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();

    // Default theme is dark
    expect(button.getAttribute('aria-label')).toBe('theme.switchToLight');

    fireEvent.click(button);

    // Theme should now be light
    expect(button.getAttribute('aria-label')).toBe('theme.switchToDark');
    expect(Analytics.trackThemeChange).toHaveBeenCalledWith('light');

    fireEvent.click(button);
    // Theme should back to dark
    expect(button.getAttribute('aria-label')).toBe('theme.switchToLight');
    expect(Analytics.trackThemeChange).toHaveBeenCalledWith('dark');
  });
});
