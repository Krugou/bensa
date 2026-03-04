import { fireEvent, render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { Analytics } from '../../utils/analytics';

describe('LanguageSwitcher', () => {
  it('should render and toggle language', () => {
    const { i18n } = useTranslation();

    render(
      <MemoryRouter>
        <LanguageSwitcher />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();

    fireEvent.click(button);

    // Initial language in mock is 'en'
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(i18n.changeLanguage).toHaveBeenCalledWith('fi');
    expect(Analytics.trackLanguageChange).toHaveBeenCalledWith('fi');
  });

  it('should display Finnish label when language is English', () => {
    const { i18n } = useTranslation();
    (i18n as { language: string }).language = 'en';

    render(
      <MemoryRouter>
        <LanguageSwitcher />
      </MemoryRouter>,
    );

    expect(screen.getByText('FI')).toBeDefined();
  });

  it('should display English label when language is Finnish', () => {
    const { i18n } = useTranslation();
    (i18n as { language: string }).language = 'fi';

    render(
      <MemoryRouter>
        <LanguageSwitcher />
      </MemoryRouter>,
    );

    expect(screen.getByText('EN')).toBeDefined();
  });
});
