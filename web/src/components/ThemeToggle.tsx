import { useTranslation } from 'react-i18next';

import { useTheme } from '../hooks/useTheme';
import { Analytics } from '../utils/analytics';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const handleToggle = () => {
    toggleTheme();
    Analytics.trackThemeChange(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-200/50 dark:bg-white/10 backdrop-blur-sm border border-slate-300/50 dark:border-white/20 text-slate-700 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-[var(--color-fuel-green)]/20 hover:border-slate-400 dark:hover:border-[var(--color-fuel-green)]/30 hover:shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_15px_rgba(0,255,0,0.2)] transition-all duration-300 cursor-pointer"
      aria-label={theme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
    >
      {theme === 'dark' ? (
        <svg
          className="w-5 h-5 animate-spin-slow"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 animate-spin-slow"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};
