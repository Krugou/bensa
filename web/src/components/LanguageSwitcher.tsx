import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Analytics } from '../utils/analytics';

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'fi', label: t('common.fi_label', { defaultValue: 'Suomi' }), flag: '🇫🇮' },
    { code: 'sv', label: t('common.sv_label', { defaultValue: 'Svenska' }), flag: '🇸🇪' },
    { code: 'en', label: t('common.en_label', { defaultValue: 'English' }), flag: '🇬🇧' },
  ];

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (code: string) => {
    void i18n.changeLanguage(code);
    void navigate(`/${code}`);
    Analytics.trackLanguageChange(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-4 rounded-xl bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high text-on-surface transition-all duration-300 cursor-pointer text-sm font-medium shadow-sm hover:shadow-md"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t('common.switch_lang')}
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="hidden sm:inline uppercase tracking-widest text-[10px] opacity-80 font-bold">
          {currentLang.code}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-300 opacity-50 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="p-1.5 flex flex-col gap-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium cursor-pointer ${
                  i18n.language === lang.code
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                <span className="text-lg leading-none">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                {i18n.language === lang.code && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
