import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Analytics } from '../utils/analytics';

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fi' : 'en';
    void i18n.changeLanguage(newLang);
    void navigate(`/${newLang}`);
    Analytics.trackLanguageChange(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center h-10 px-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300 cursor-pointer font-medium font-mono text-sm"
      aria-label={t('common.switch_lang')}
    >
      <span className="flex items-center gap-1.5">
        {i18n.language === 'en' && (
          <span className="flex items-center gap-1.5">
            <span className="text-base">🇫🇮</span>
            <span>{t('common.fi_label', { defaultValue: 'FI' })}</span>
          </span>
        )}
        {i18n.language !== 'en' && (
          <span className="flex items-center gap-1.5">
            <span className="text-base">🇬🇧</span>
            <span>{t('common.en_label', { defaultValue: 'EN' })}</span>
          </span>
        )}
      </span>
    </button>
  );
};
