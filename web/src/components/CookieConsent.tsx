import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { initAnalytics } from '../firebase';

export const CookieConsent = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === null) {
      // Delay visibility for a smoother experience
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, []);

  const handleConsent = (accepted: boolean) => {
    localStorage.setItem('cookie_consent', accepted ? 'true' : 'false');
    initAnalytics(accepted);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9999] animate-fade-in">
      <div className="glass-card p-6 shadow-2xl border-bensa-teal/30 bg-main/95 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🍪</div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-main">
              {t('cookies.title', 'Cookie settings')}
            </h3>
            <p className="text-[11px] text-text-muted leading-relaxed font-mono">
              {t(
                'cookies.description',
                'We use Google Analytics to understand how our users find the cheapest gas. No personal data is stored.',
              )}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  handleConsent(true);
                }}
                className="flex-1 px-4 py-2 bg-fuel-green/20 border border-fuel-green/40 rounded-lg text-fuel-green text-[10px] font-black uppercase tracking-tighter hover:bg-fuel-green/30 transition-all cursor-pointer"
              >
                {t('cookies.accept', 'Accept all')}
              </button>
              <button
                onClick={() => {
                  handleConsent(false);
                }}
                className="px-4 py-2 bg-card border border-border-card rounded-lg text-text-muted text-[10px] font-bold uppercase tracking-tighter hover:bg-card-hover transition-all cursor-pointer"
              >
                {t('cookies.deny', 'Decline')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
