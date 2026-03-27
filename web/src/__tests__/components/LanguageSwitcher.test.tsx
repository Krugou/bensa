import { fireEvent, render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { Analytics } from '../../utils/analytics';

describe('LanguageSwitcher', () => {
  it('should render and open dropdown on click', () => {
    render(
      <MemoryRouter>
        <LanguageSwitcher />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();

    // Check if dropdown items are not visible initially
    // We check for Svenska and English since Suomi might be the default label if lng=fi
    expect(screen.queryByText('Svenska')).toBeNull();
    expect(screen.queryByText('English')).toBeNull();

    // Click to open
    fireEvent.click(button);

    // Now it should show all languages
    expect(screen.getByText('Suomi')).toBeDefined();
    expect(screen.getByText('Svenska')).toBeDefined();
    expect(screen.getByText('English')).toBeDefined();
  });

  it('should change language and close dropdown when an option is selected', () => {
    const { i18n } = useTranslation();

    render(
      <MemoryRouter>
        <LanguageSwitcher />
      </MemoryRouter>,
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Select Swedish
    const swedishBtn = screen.getByText('Svenska');
    fireEvent.click(swedishBtn);

    // Verify i18n call
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(i18n.changeLanguage).toHaveBeenCalledWith('sv');
    expect(Analytics.trackLanguageChange).toHaveBeenCalledWith('sv');

    // Dropdown should be closed - check that English (another option) is gone
    expect(screen.queryByText('English')).toBeNull();
  });
});
